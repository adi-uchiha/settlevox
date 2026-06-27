import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { ENV } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

// Load all Gemini API keys from process.env
const GEMINI_KEYS: string[] = [];
if (ENV.GEMINI_API_KEY) GEMINI_KEYS.push(ENV.GEMINI_API_KEY);
for (let i = 1; i <= 50; i++) {
  const key = process.env[`GEMINI_KEY_${i}`];
  if (key && !GEMINI_KEYS.includes(key)) {
    GEMINI_KEYS.push(key);
  }
}
let activeGeminiIndex = 0;

// Load all Groq API keys from process.env
const GROQ_KEYS: string[] = [];
if (process.env.GROQ_API_KEY) GROQ_KEYS.push(process.env.GROQ_API_KEY);
for (let i = 1; i <= 50; i++) {
  const key = process.env[`GROQ_KEY_${i}`];
  if (key && !GROQ_KEYS.includes(key)) {
    GROQ_KEYS.push(key);
  }
}
let activeGroqIndex = 0;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
// Track keys permanently blacklisted for this model (e.g. org-level model permission blocks)
const GROQ_BLACKLISTED: Set<number> = new Set();

export class LLMEngine extends EventEmitter {
  private ai: GoogleGenAI | null = null;
  private currentStream: any = null;
  private abortController: AbortController | null = null;
  private history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  
  constructor() {
    super();
    // Initialize Gemini only if keys are present
    if (GEMINI_KEYS.length > 0) {
      this.ai = new GoogleGenAI({ apiKey: GEMINI_KEYS[activeGeminiIndex] as string });
    }
  }

  // ==========================================
  // Groq API Logic (Active Engine)
  // ==========================================
  
  private getGroqClient(): Groq {
    const apiKey = GROQ_KEYS[activeGroqIndex] || process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      throw new Error('No Groq API keys found in env variables.');
    }
    return new Groq({ apiKey });
  }

  private rotateGroqKey(blacklistCurrent = false) {
    if (GROQ_KEYS.length === 0) return;
    if (blacklistCurrent) {
      GROQ_BLACKLISTED.add(activeGroqIndex);
      logger.warn({ blacklistedIndex: activeGroqIndex, model: GROQ_MODEL }, 'Blacklisted Groq key — model blocked at org level');
    }
    // Rotate to the next non-blacklisted key
    let nextIndex = (activeGroqIndex + 1) % GROQ_KEYS.length;
    const maxAttempts = GROQ_KEYS.length;
    for (let i = 0; i < maxAttempts; i++) {
      if (!GROQ_BLACKLISTED.has(nextIndex)) break;
      nextIndex = (nextIndex + 1) % GROQ_KEYS.length;
    }
    activeGroqIndex = nextIndex;
    logger.info({ newIndex: activeGroqIndex, totalKeys: GROQ_KEYS.length, blacklisted: GROQ_BLACKLISTED.size }, 'Rotated Groq API Key');
  }

  public async generateResponse(systemPrompt: string, userText: string): Promise<void> {
    this.abortController = new AbortController();
    this.history.push({ role: 'user', parts: [{ text: userText }] });

    const activeKeys = GROQ_KEYS.length - GROQ_BLACKLISTED.size;
    const maxAttempts = Math.max(activeKeys, 1);
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        await this.streamCombinedResponseGroq(systemPrompt);
        // Rotate after each successful prompt invocation to distribute load
        this.rotateGroqKey();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError' || this.abortController?.signal.aborted) {
          logger.info('Groq stream aborted due to barge-in');
          return;
        }

        attempts++;
        const status = err.status || err.response?.status;
        const isOrgBlock = String(err.message || err).includes('model_permission_blocked_org');

        if (isOrgBlock) {
          // This key can never use this model — blacklist it immediately, no cooldown needed
          logger.warn({ keyIndex: activeGroqIndex, model: GROQ_MODEL }, 'Groq key blacklisted: model blocked at org level. Skipping permanently.');
          this.rotateGroqKey(true); // blacklist=true
        } else {
          logger.warn({ attempt: attempts, status, err: err.message }, 'Groq API error, rotating key and retrying...');
          this.rotateGroqKey();
          // Brief cooldown only for transient errors (rate limits, 503s)
          await new Promise(r => setTimeout(r, 500));
        }
        this.currentStream = null;
      }
    }

    logger.error('Exhausted all usable Groq API keys for generation');
    this.emit('error', new Error('All Groq API keys exhausted'));
  }

  private async streamCombinedResponseGroq(systemPrompt: string): Promise<void> {
    logger.info({ keyIndex: activeGroqIndex }, 'Sending prompt to Groq...');
    
    const groq = this.getGroqClient();
    
    // Map Gemini history role format to OpenAI/Groq standard role format
    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts[0]?.text || ''
      }))
    ];

    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: messages as any,
      temperature: 0.2,
      max_tokens: 600,
      stream: true,
    }, {
      signal: this.abortController?.signal
    });

    this.currentStream = stream;

    let fullResponse = '';
    let hitDelimiter = false;
    let speechEmitted = 0;
    const DELIMITER = '<FSM_STATE>';

    for await (const chunk of stream) {
      if (this.abortController?.signal.aborted) {
        // Save partial speech to history so conversation context is preserved
        if (fullResponse.trim()) {
          const speechOnly = fullResponse.split(DELIMITER)[0]?.trim() || '';
          const lastMsg = this.history[this.history.length - 1];
          if (speechOnly) {
            if (lastMsg && lastMsg.role === 'model') {
              lastMsg.parts[0]!.text += `\n${speechOnly}`;
            } else {
              this.history.push({ role: 'model', parts: [{ text: speechOnly }] });
            }
          }
        }
        throw new Error('AbortError');
      }

      const text = chunk.choices[0]?.delta?.content || '';
      if (!text) continue;

      fullResponse += text;

      // Once we've hit the delimiter, stop emitting speech chunks immediately.
      if (hitDelimiter) continue;

      const delimiterIndex = fullResponse.indexOf(DELIMITER);
      
      if (delimiterIndex !== -1) {
        hitDelimiter = true;
        // Emit exactly the remaining speech up to the delimiter, nothing more.
        const speechPart = fullResponse.substring(0, delimiterIndex);
        const newSpeech = speechPart.substring(speechEmitted);
        if (newSpeech) {
          this.emit('llm_chunk', newSpeech);
          speechEmitted += newSpeech.length;
        }
      } else {
        // Delimiter not found yet. Hold back enough chars in case delimiter spans chunks.
        const safeEmitLength = Math.max(0, fullResponse.length - DELIMITER.length);
        const newSpeech = fullResponse.substring(speechEmitted, safeEmitLength);
        if (newSpeech) {
          this.emit('llm_chunk', newSpeech);
          speechEmitted += newSpeech.length;
        }
      }
    }

    if (!this.abortController?.signal.aborted) {
      this.history.push({ role: 'model', parts: [{ text: fullResponse }] });
      
      const parts = fullResponse.split(DELIMITER);
      const finalSpeech = parts[0] || '';
      const jsonBuffer = parts.length > 1 ? parts[1] || '' : '';

      // Emit any remaining speech if the stream ended without hitting the delimiter
      if (!hitDelimiter) {
        const remainingSpeech = finalSpeech.substring(speechEmitted);
        if (remainingSpeech) {
          this.emit('llm_chunk', remainingSpeech);
        }
      }

      this.emit('llm_complete', finalSpeech);
      
      if (hitDelimiter && jsonBuffer.trim()) {
        try {
          let cleanJson = '';
          const startIdx = jsonBuffer.indexOf('{');
          const endIdx = jsonBuffer.lastIndexOf('}');
          
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            cleanJson = jsonBuffer.substring(startIdx, endIdx + 1);
          } else {
            cleanJson = jsonBuffer.trim();
            if (cleanJson.startsWith('```json')) {
              cleanJson = cleanJson.substring(7);
            } else if (cleanJson.startsWith('```')) {
              cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith('```')) {
              cleanJson = cleanJson.substring(0, cleanJson.length - 3);
            }
          }
          const parsed = JSON.parse(cleanJson);
          this.emit('data_extracted', parsed);
        } catch (e) {
          logger.error({ err: e, jsonBuffer }, 'Failed to parse combined JSON output');
        }
      }
    }
  }

  public async generateSummaryAndSentiment(conversationHistory: string): Promise<{ summary: string; sentiment: 'positive' | 'neutral' | 'negative' }> {
    logger.info('Generating call summary and sentiment via Groq...');
    let attempts = 0;
    const maxAttempts = GROQ_KEYS.length || 1;
    while (attempts < maxAttempts) {
      try {
        const groq = this.getGroqClient();
        const response = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            { role: 'user', content: `Analyze the following conversation transcript and return a JSON object with two fields:\n1. "summary": A concise 1-sentence summary of the incident and call details.\n2. "sentiment": One of "positive", "neutral", or "negative" describing the caller's sentiment.\n\nTranscript:\n${conversationHistory}` }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });
        
        // Rotate after successful call
        this.rotateGroqKey();
        
        const cleanText = response.choices[0]?.message?.content || '{}';
        const json = JSON.parse(cleanText.trim());
        return {
          summary: json.summary || 'No summary generated.',
          sentiment: json.sentiment || 'neutral'
        };
      } catch (err: any) {
        attempts++;
        this.rotateGroqKey();
        logger.warn({ attempt: attempts, err: err.message }, 'Failed to generate summary and sentiment on Groq, retrying...');
        await new Promise(r => setTimeout(r, 500));
      }
    }
    return { summary: 'Failed due to rate limits.', sentiment: 'neutral' };
  }

  // ==========================================
  // Gemini API Logic (Inactive, Preserved)
  // ==========================================
  
  private rotateGeminiKey() {
    if (GEMINI_KEYS.length === 0) return;
    activeGeminiIndex = (activeGeminiIndex + 1) % GEMINI_KEYS.length;
    logger.warn({ newIndex: activeGeminiIndex, totalKeys: GEMINI_KEYS.length }, 'Rotated Gemini API Key due to rate limit/error');
    this.ai = new GoogleGenAI({ apiKey: GEMINI_KEYS[activeGeminiIndex] as string });
  }

  public async generateResponseGemini(systemPrompt: string, userText: string): Promise<void> {
    this.abortController = new AbortController();
    this.history.push({ role: 'user', parts: [{ text: userText }] });

    let attempts = 0;
    const maxAttempts = GEMINI_KEYS.length || 1;
    while (attempts < maxAttempts) {
      try {
        await this.streamCombinedResponseGemini(systemPrompt);
        return; // Success
      } catch (err: any) {
        if (err.name === 'AbortError' || this.abortController?.signal.aborted) {
          logger.info('Gemini stream aborted');
          return;
        }

        const status = err.status || err.response?.status;
        if (status === 429 || status === 503 || status === 400 || String(err).includes('429')) {
          attempts++;
          logger.warn({ attempt: attempts, status }, 'Gemini rate limited or invalid key, retrying with next key');
          this.rotateGeminiKey();
          this.currentStream = null;
          await new Promise(r => setTimeout(r, 500));
        } else {
          logger.error({ err }, 'Gemini generation error');
          this.emit('error', err);
          return;
        }
      }
    }

    logger.error('Exhausted all API keys for Gemini generation');
    this.emit('error', new Error('All API keys exhausted'));
  }

  private async streamCombinedResponseGemini(systemPrompt: string): Promise<void> {
    if (!this.ai) throw new Error('Gemini client not initialized.');
    logger.info({ keyIndex: activeGeminiIndex }, 'Sending prompt to Gemini...');
    
    const model = 'gemini-3.5-flash';
    this.currentStream = await this.ai.models.generateContentStream({
      model,
      contents: this.history,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        maxOutputTokens: 600,
      },
    });

    let fullResponse = '';
    let hitDelimiter = false;
    let speechEmitted = 0;
    const DELIMITER = '<FSM_STATE>';

    for await (const chunk of this.currentStream) {
      if (this.abortController?.signal.aborted) {
        if (fullResponse.trim()) {
          const speechOnly = fullResponse.split(DELIMITER)[0]?.trim() || '';
          const lastMsg = this.history[this.history.length - 1];
          if (speechOnly) {
            if (lastMsg && lastMsg.role === 'model') {
              lastMsg.parts[0]!.text += `\n${speechOnly}`;
            } else {
              this.history.push({ role: 'model', parts: [{ text: speechOnly }] });
            }
          }
        }
        throw new Error('AbortError');
      }
      
      const text = (chunk as { text: string }).text;
      if (!text) continue;
      
      fullResponse += text;

      if (hitDelimiter) continue;

      const delimiterIndex = fullResponse.indexOf(DELIMITER);
      
      if (delimiterIndex !== -1) {
        hitDelimiter = true;
        const speechPart = fullResponse.substring(0, delimiterIndex);
        const newSpeech = speechPart.substring(speechEmitted);
        if (newSpeech) {
          this.emit('llm_chunk', newSpeech);
          speechEmitted += newSpeech.length;
        }
      } else {
        const safeEmitLength = Math.max(0, fullResponse.length - DELIMITER.length);
        const newSpeech = fullResponse.substring(speechEmitted, safeEmitLength);
        if (newSpeech) {
          this.emit('llm_chunk', newSpeech);
          speechEmitted += newSpeech.length;
        }
      }
    }

    if (!this.abortController?.signal.aborted) {
      this.history.push({ role: 'model', parts: [{ text: fullResponse }] });
      
      const parts = fullResponse.split(DELIMITER);
      const finalSpeech = parts[0] || '';
      const jsonBuffer = parts.length > 1 ? parts[1] || '' : '';

      if (!hitDelimiter) {
        const remainingSpeech = finalSpeech.substring(speechEmitted);
        if (remainingSpeech) {
          this.emit('llm_chunk', remainingSpeech);
        }
      }

      this.emit('llm_complete', finalSpeech);
      
      if (hitDelimiter && jsonBuffer.trim()) {
        try {
          let cleanJson = '';
          const startIdx = jsonBuffer.indexOf('{');
          const endIdx = jsonBuffer.lastIndexOf('}');
          
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            cleanJson = jsonBuffer.substring(startIdx, endIdx + 1);
          } else {
            cleanJson = jsonBuffer.trim();
            if (cleanJson.startsWith('```json')) {
              cleanJson = cleanJson.substring(7);
            } else if (cleanJson.startsWith('```')) {
              cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith('```')) {
              cleanJson = cleanJson.substring(0, cleanJson.length - 3);
            }
          }
          const parsed = JSON.parse(cleanJson);
          this.emit('data_extracted', parsed);
        } catch (e) {
          logger.error({ err: e, jsonBuffer }, 'Failed to parse combined JSON output');
        }
      }
    }
  }

  public async generateSummaryAndSentimentGemini(conversationHistory: string): Promise<{ summary: string; sentiment: 'positive' | 'neutral' | 'negative' }> {
    if (!this.ai) throw new Error('Gemini client not initialized.');
    logger.info('Generating call summary and sentiment via Gemini...');
    let attempts = 0;
    const maxAttempts = GEMINI_KEYS.length || 1;
    while (attempts < maxAttempts) {
      try {
        const response = await this.ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [{ role: 'user', parts: [{ text: `Analyze the following conversation transcript and return a JSON object with two fields:\n1. "summary": A concise 1-sentence summary of the incident and call details.\n2. "sentiment": One of "positive", "neutral", or "negative" describing the caller's sentiment.\n\nTranscript:\n${conversationHistory}` }] }],
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          }
        });
        const cleanText = (response.text || '{}').replace(/```(json)?/gi, '').trim();
        const json = JSON.parse(cleanText || '{}');
        return {
          summary: json.summary || 'No summary generated.',
          sentiment: json.sentiment || 'neutral'
        };
      } catch (err: any) {
        const status = err.status || err.response?.status;
        if (status === 429 || status === 503 || status === 400 || String(err).includes('429')) {
          attempts++;
          this.rotateGeminiKey();
        } else {
          logger.error({ err }, 'Failed to generate summary and sentiment');
          return { summary: 'Failed to generate summary.', sentiment: 'neutral' };
        }
      }
    }
    return { summary: 'Failed due to rate limits.', sentiment: 'neutral' };
  }

  // ==========================================
  // Helper Logic
  // ==========================================

  public injectAssistantMessage(text: string): void {
    if (!text) return;
    const lastMsg = this.history[this.history.length - 1];
    if (lastMsg && lastMsg.role === 'model') {
      lastMsg.parts[0]!.text += `\n${text}`;
    } else {
      this.history.push({ role: 'model', parts: [{ text }] });
    }
  }

  public interrupt(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public reset(): void {
    this.history = [];
    this.interrupt();
  }
}
