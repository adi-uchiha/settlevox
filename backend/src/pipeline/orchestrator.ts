import { WebSocket } from 'ws';
import { SpeechToText } from './stt.js';
import { LLMEngine } from './llm.js';
import { TextToSpeech } from './tts.js';
import { IntakeFSM } from '../agent/intake-fsm.js';
import { buildSystemPrompt } from '../agent/prompts.js';
import { IntakeDataSchema } from '../agent/schemas.js';
import { checkGuardrails, FALLBACK_MESSAGE } from '../agent/guardrails.js';
import { updateCall, createCall } from '../integrations/db.js';
import type { CallRecord } from '../integrations/db.js';
import type { CMSAdapter } from '../integrations/cms-adapter.js';
import { FilevineMock } from '../integrations/filevine-mock.js';
import { logger } from '../utils/logger.js';

const cmsAdapter = new FilevineMock();

export class Orchestrator {
  private stt: SpeechToText;
  private llm: LLMEngine;
  private tts: TextToSpeech;
  private fsm: IntakeFSM;
  private twilioWs: WebSocket;
  private streamSid: string;
  private callId: string;
  private conversationHistory: string = '';
  private phoneNumber: string;
  private startTime: number = 0;
  
  // Phase 2 Latency: Micro-chunk on terminal punctuation for Cartesia prosody
  private sentenceRegex = /[.?!]\s/;
  private ttsBuffer = '';
  private currentContextId: string = '';
  private silenceTimer: NodeJS.Timeout | null = null;
  private consecutiveSilenceCount = 0;
  private isAgentSpeaking = false;
  private isGenerating = false; // Guard: prevents concurrent LLM calls
  private shouldHangUp = false; // Flag to hang up after agent finishes speaking
  private transcriptData: { speaker: 'agent' | 'caller'; text: string; timestamp: number }[] = [];

  constructor(twilioWs: WebSocket, streamSid: string, callSid: string, phoneNumber?: string) {
    this.twilioWs = twilioWs;
    this.streamSid = streamSid;
    this.callId = callSid; // Use the actual Call SID from Twilio
    this.phoneNumber = phoneNumber || 'Unknown';

    this.stt = new SpeechToText();
    this.llm = new LLMEngine();
    this.tts = new TextToSpeech();
    this.fsm = new IntakeFSM();

    this.setupEvents();
  }

  public async start() {
    this.startTime = Date.now();
    const call = await createCall({ 
      call_id: this.callId, 
      status: 'ringing', 
      phone_number: this.phoneNumber 
    });
    // this.callId is already set to the proper Call SID
    await updateCall(this.callId, { status: 'initiated' });
    
    await Promise.all([
      this.stt.connect(),
      this.tts.connect()
    ]);
    
    logger.info({ callId: this.callId }, 'Orchestrator pipeline started');
    
    // Hyper-optimized zero-latency initial greeting — bypass LLM entirely
    this.isAgentSpeaking = true;
    this.isGenerating = true; // Block any incoming speech from triggering a response until audio plays
    this.currentContextId = `ctx_${Date.now()}`;
    const initialGreeting = "Welcome to SettleVox. I'm your AI assistant, and my goal is to help you connect with a personal injury attorney at the earliest. Before we begin the intake, do I have your consent to record this call?";
    this.tts.sendText(initialGreeting, this.currentContextId, false);
    this.llm.injectAssistantMessage(initialGreeting);
    this.conversationHistory += `\nAgent: ${initialGreeting}`;
    this.transcriptData.push({ speaker: 'agent', text: initialGreeting, timestamp: Date.now() });
    // Don't start silence timer here — handleMark will do it once the audio is done playing
  }

  private setupEvents() {
    this.stt.on('interim_transcript', this.handleInterimTranscript.bind(this));
    this.stt.on('final_transcript', this.handleFinalTranscript.bind(this));
    this.llm.on('llm_chunk', this.handleLLMChunk.bind(this));
    this.llm.on('llm_complete', this.handleLLMComplete.bind(this));
    this.llm.on('data_extracted', this.handleDataExtracted.bind(this));
    this.tts.on('audio_chunk', this.handleAudioChunk.bind(this));
    this.tts.on('audio_done', this.handleAudioDone.bind(this));
    
    // Prevent unhandled emitter errors from crashing the Node.js process
    this.stt.on('error', (err) => logger.warn({ err, callId: this.callId }, 'STT Emitter Warning'));
    this.llm.on('error', (err) => logger.warn({ err, callId: this.callId }, 'LLM Emitter Warning'));
    this.tts.on('error', (err) => logger.warn({ err, callId: this.callId }, 'TTS Emitter Warning'));
  }

  public receiveAudio(audioBuffer: Buffer) {
    this.stt.sendAudio(audioBuffer);
  }

  private handleInterimTranscript(text: string) {
    if (text.length <= 3 || text.startsWith('[')) return;
    // Don't react to caller speech during terminal phases — the call is wrapping up
    const phaseName = this.fsm.getCurrentPhase().name;
    if (phaseName === 'DISQUALIFICATION') return;

    this.resetSilenceTimer();
    if (this.isAgentSpeaking) {
      // Prevent echo cancellation failures from instantly barging in
      // Require at least 2 words or a word longer than 5 characters to interrupt
      const words = text.trim().split(/\s+/);
      if (words.length >= 2 || text.length > 5) {
        this.handleBargeIn();
      }
    }
  }

  private async handleFinalTranscript(text: string) {
    try {
      this.consecutiveSilenceCount = 0;
      this.conversationHistory += `\nCaller: ${text}`;
      this.transcriptData.push({ speaker: 'caller', text, timestamp: Date.now() });

      // Guard: ignore all caller input during terminal phases — the goodbye is already playing
      const phaseName = this.fsm.getCurrentPhase().name;
      if (phaseName === 'DISQUALIFICATION') {
        logger.info({ callId: this.callId, phase: phaseName }, 'Terminal phase active — ignoring caller input, call is ending.');
        return;
      }

      this.resetSilenceTimer();

      // Guard: if already generating, ignore. Prevents queuing multiple concurrent LLM calls
      // when a caller says multiple short phrases in quick succession.
      if (this.isGenerating) {
        logger.info({ callId: this.callId }, 'LLM already generating, ignoring overlapping transcript.');
        return;
      }

      this.triggerAgentResponse(text);
    } catch (err) {
      logger.error({ err, callId: this.callId }, 'Error handling final transcript');
    }
  }

  private handleLLMChunk(chunk: string) {
    try {
      this.isAgentSpeaking = true;
      this.clearSilenceTimer();
      this.ttsBuffer += chunk;
      
      const guardrailCheck = checkGuardrails(this.ttsBuffer);
      if (!guardrailCheck.safe) {
        logger.warn({ callId: this.callId, reason: guardrailCheck.reason }, 'Guardrail triggered');
        this.handleBargeIn(); 
        this.tts.sendText(FALLBACK_MESSAGE, `fallback_${Date.now()}`);
        this.llm.injectAssistantMessage(FALLBACK_MESSAGE);
        this.conversationHistory += `\nAgent: ${FALLBACK_MESSAGE}`;
        this.transcriptData.push({ speaker: 'agent', text: FALLBACK_MESSAGE, timestamp: Date.now() });
        return;
      }
      
      let match = this.ttsBuffer.match(this.sentenceRegex);
      while (match && match.index !== undefined) {
        const splitIndex = match.index + match[0].length;
        const sentence = this.ttsBuffer.substring(0, splitIndex);
        this.ttsBuffer = this.ttsBuffer.substring(splitIndex);
        this.tts.sendText(sentence, this.currentContextId, true);
        match = this.ttsBuffer.match(this.sentenceRegex);
      }
    } catch (err) {
      logger.error({ err, callId: this.callId }, 'Error handling LLM chunk');
    }
  }

  private handleLLMComplete(fullText: string) {
    try {
      // Always finalize the TTS context so Cartesia knows the turn is done.
      // Only send remaining buffer text; never send empty string (Cartesia rejects it).
      const remainingBuffer = this.ttsBuffer.trim();
      this.ttsBuffer = '';
      if (remainingBuffer.length > 0) {
        this.tts.sendText(remainingBuffer, this.currentContextId, false);
      } else {
        this.tts.finalizeContext(this.currentContextId);
      }

      // Only add to transcript the speech portion (before the <FSM_STATE> delimiter)
      const speechOnly = fullText.split('<FSM_STATE>')[0]?.trim() || '';
      if (speechOnly) {
        this.conversationHistory += `\nAgent: ${speechOnly}`;
        this.transcriptData.push({ speaker: 'agent', text: speechOnly, timestamp: Date.now() });
      }
      
      this.isGenerating = false;
    } catch (err) {
      logger.error({ err, callId: this.callId }, 'Error handling LLM completion');
      this.isGenerating = false;
    }
  }

  private handleAudioDone() {
    // Wait for Cartesia to finish sending all audio for this context
    // before asking Twilio to place the 'mark' event.
    // This guarantees the agent won't be marked as silent until the audio actually finishes playing.
    if (this.twilioWs.readyState === WebSocket.OPEN) {
      this.twilioWs.send(JSON.stringify({
        event: 'mark',
        streamSid: this.streamSid,
        mark: { name: this.currentContextId }
      }));
    }
  }

  public handleMark(markName: string) {
    if (markName === this.currentContextId) {
      this.isAgentSpeaking = false;
      this.isGenerating = false; // Audio done playing, now safe to accept new caller input
      
      // Graceful Termination Check
      if (this.shouldHangUp) {
        logger.info({ callId: this.callId }, 'Agent finished final goodbye. Hanging up in 2s.');
        setTimeout(() => this.twilioWs.close(), 2000);
      } else {
        this.resetSilenceTimer();
      }
    }
  }

  private handleAudioChunk(audioBase64: string) {
    if (this.twilioWs.readyState === WebSocket.OPEN) {
      this.twilioWs.send(JSON.stringify({
        event: 'media',
        streamSid: this.streamSid,
        media: {
          payload: audioBase64
        }
      }));
    }
  }

  private handleBargeIn() {
    this.isAgentSpeaking = false;
    this.isGenerating = false; // Barge-in resets the generation lock
    this.llm.interrupt();
    this.tts.interrupt();
    this.ttsBuffer = '';
    this.currentContextId = `ctx_${Date.now()}`;
    
    if (this.twilioWs.readyState === WebSocket.OPEN) {
      this.twilioWs.send(JSON.stringify({
        event: 'clear',
        streamSid: this.streamSid
      }));
    }
  }

  private handleDataExtracted(extractedData: any) {
    if (Object.keys(extractedData).length > 0) {
      const phaseBefore = this.fsm.getCurrentPhase().name;
      this.fsm.updateData(extractedData);
      const phaseAfter = this.fsm.getCurrentPhase().name;

      updateCall(this.callId, { 
        extracted_data: this.fsm.getExtractedData(),
        final_phase: phaseAfter
      }).catch(err => {
        logger.error({ err, callId: this.callId }, 'Failed to update call data during extraction');
      });

      if (this.fsm.getExtractedData().call_ended_by_user === true) {
        logger.info({ callId: this.callId }, 'LLM extracted call_ended_by_user=true. Flagging call for graceful termination.');
        this.shouldHangUp = true;
      }

      // If the FSM just fast-tracked to DISQUALIFICATION, abort the current LLM turn
      // (which was responding to a different phase) and fire a dedicated DISQUALIFICATION response.
      // Without this, the disqualification message is never spoken — the LIABILITY turn's LLM
      // may produce no speech (only <FSM_STATE>) and handleMark fires silently into the hangup.
      if (phaseBefore !== 'DISQUALIFICATION' && phaseAfter === 'DISQUALIFICATION') {
        logger.info({ callId: this.callId }, 'FSM transitioned to DISQUALIFICATION — triggering dedicated disqualification response.');
        this.llm.interrupt();
        this.tts.interrupt();
        this.ttsBuffer = '';
        
        if (this.twilioWs.readyState === WebSocket.OPEN) {
          this.twilioWs.send(JSON.stringify({
            event: 'clear',
            streamSid: this.streamSid
          }));
        }
        
        // Use setImmediate to let the current event loop tick finish before starting the new turn
        setImmediate(() => this.triggerAgentResponse());
      }
    }
  }

  private async triggerAgentResponse(userText?: string) {
    try {
      this.isAgentSpeaking = true;
      this.isGenerating = true;
      this.clearSilenceTimer();
      this.currentContextId = `ctx_${Date.now()}`;
      
      const phase = this.fsm.getCurrentPhase();
      const prompt = buildSystemPrompt(phase, this.conversationHistory);
      this.llm.generateResponse(prompt, userText || 'Start the intake.');
    } catch (err) {
      logger.error({ err, callId: this.callId }, 'Error triggering agent response');
      this.isGenerating = false;
    }
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private resetSilenceTimer() {
    this.clearSilenceTimer();
    const phase = this.fsm.getCurrentPhase().name;
    if (phase === 'DISQUALIFICATION') return;
    
    this.silenceTimer = setTimeout(() => {
      // Don't fire silence prompt while agent is still speaking or generating
      if ((this.isAgentSpeaking || this.isGenerating) && this.twilioWs.readyState === WebSocket.OPEN) {
        // Reschedule — audio is still playing, check again
        this.resetSilenceTimer();
        return;
      }
      if (!this.isAgentSpeaking && this.twilioWs.readyState === WebSocket.OPEN) {
        this.consecutiveSilenceCount++;
        
        this.isAgentSpeaking = true;
        this.isGenerating = true;
        this.currentContextId = `ctx_${Date.now()}`;
        
        if (this.consecutiveSilenceCount >= 3) {
          logger.info({ callId: this.callId }, 'Maximum silence reached. Terminating call.');
          const promptText = "I'm not hearing anything, so I'm going to end this call. Have a great day.";
          this.tts.sendText(promptText, this.currentContextId, false);
          this.llm.injectAssistantMessage(promptText);
          setTimeout(() => this.twilioWs.close(), 5000);
          return;
        }

        logger.info({ callId: this.callId, attempt: this.consecutiveSilenceCount }, 'Silence detected. Triggering prompt.');
        const promptText = "Are you still there?";
        this.tts.sendText(promptText, this.currentContextId, false);
        this.llm.injectAssistantMessage(promptText);
        this.conversationHistory += `\nAgent: ${promptText}`;
        this.transcriptData.push({ speaker: 'agent', text: promptText, timestamp: Date.now() });
        
        this.twilioWs.send(JSON.stringify({
          event: 'mark',
          streamSid: this.streamSid,
          mark: { name: this.currentContextId }
        }));
      }
    }, 10000);
  }

  public async destroy() {
    this.clearSilenceTimer();
    this.stt.disconnect();
    this.tts.disconnect();
    this.llm.reset();
    
    try {
      // 2. Generate AI Summary and Sentiment Analysis
      let summary = 'No summary generated.';
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (this.conversationHistory.trim().length > 0) {
        try {
          const res = await this.llm.generateSummaryAndSentiment(this.conversationHistory);
          summary = res.summary;
          sentiment = res.sentiment;
        } catch (e) {
          logger.error({ err: e }, 'AI Summary generation failed');
        }
      }

      // 3. Track duration and ended timestamp
      const durationSeconds = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
      const endedAt = new Date().toISOString();

      // 4. Save call details to the CMS singleton
      const extractedData = this.fsm.getExtractedData();
      const cmsResult = await cmsAdapter.createLead(extractedData);
      
      // 5. Update call record in database
      await updateCall(this.callId, {
        status: 'completed',
        cms_id: cmsResult.id,
        transcript: this.transcriptData,
        duration_seconds: durationSeconds,
        ended_at: endedAt,
        ai_summary: summary,
        sentiment: sentiment,
        extracted_data: extractedData,
      }); 
      
      logger.info({ callId: this.callId, cmsId: cmsResult.id, durationSeconds, endedAt }, 'Call completed and saved to CMS');
    } catch (err) {
      logger.error({ err, callId: this.callId }, 'Failed to save call data to CMS');
    }
  }
}
