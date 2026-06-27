import Cartesia from '@cartesia/cartesia-js';
import { ENV } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

export class TextToSpeech extends EventEmitter {
  private cartesia: Cartesia;
  private ws: any = null;
  private isConnected = false;
  private currentContextId: string | null = null;
  private voiceId = ENV.CARTESIA_VOICE_ID;
  private textQueue: { text: string; contextId: string; isContinue: boolean }[] = [];

  constructor() {
    super();
    this.cartesia = new Cartesia({ apiKey: ENV.CARTESIA_API_KEY });
  }

  public async connect(): Promise<void> {
    logger.info('Connecting to Cartesia...');
    
    try {
      this.ws = await this.cartesia.tts.websocket();
      
      this.isConnected = true;
      logger.info('Cartesia connected');

      // Flush queued texts
      while (this.textQueue.length > 0) {
        const item = this.textQueue.shift();
        if (item) {
          this.sendText(item.text, item.contextId, item.isContinue);
        }
      }

      this.ws.on('chunk', (msg: any) => {
        // Pass the raw base64 string directly (Zero-Copy Passthrough)
        this.emit('audio_chunk', msg.data);
      });
      
      this.ws.on('done', (msg: any) => {
        // Only emit audio_done if this is for the currently active context.
        // Cancelled contexts also fire 'done' — we must ignore those to avoid
        // premature handleAudioDone triggering the hangup timer.
        const doneContextId = msg?.context_id;
        if (doneContextId && doneContextId !== this.currentContextId) {
          return; // Stale context — ignore
        }
        this.emit('audio_done');
      });
      
      this.ws.on('error', (msg: any) => {
        const errorMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
        if (errorMsg.includes('does not exist') || errorMsg.includes('already been cancelled') || errorMsg.includes('Context closed')) {
          // Ignore expected errors from rapid barge-ins
          return;
        }
        logger.error({ error: msg }, 'Cartesia error');
        this.emit('error', msg);
      });
      
    } catch (err) {
      logger.error({ err }, 'Cartesia connection failed');
      this.emit('error', err);
    }
  }

  public sendText(text: string, contextId: string, isContinue: boolean = true): void {
    if (!this.isConnected || !this.ws) {
      this.textQueue.push({ text, contextId, isContinue });
      return;
    }
    
    logger.debug({ text, contextId }, 'Sending text to Cartesia');
    
    this.currentContextId = contextId;
    
    this.ws.send({
      model_id: 'sonic-3.5',
      voice: {
        mode: 'id',
        id: this.voiceId,
      },
      output_format: {
        container: 'raw',
        encoding: 'pcm_mulaw',
        sample_rate: 8000
      },
      transcript: text,
      context_id: contextId,
      continue: isContinue,
    });
  }

  public finalizeContext(contextId: string): void {
    // Send a single space to finalize/close a context when we have nothing left in the buffer.
    // Sending an empty string causes Cartesia to return "No valid transcripts passed" (400).
    if (!this.isConnected || !this.ws) return;
    this.ws.send({
      model_id: 'sonic-3.5',
      voice: { mode: 'id', id: this.voiceId },
      output_format: { container: 'raw', encoding: 'pcm_mulaw', sample_rate: 8000 },
      transcript: ' ',
      context_id: contextId,
      continue: false,
    });
  }

  public async interrupt(): Promise<void> {
    if (!this.isConnected || !this.ws || !this.currentContextId) return;
    
    logger.info('Interrupting Cartesia playback');
    try {
      await this.ws.cancelContext(this.currentContextId);
      this.currentContextId = null; // Clear context so its 'done' event is ignored
    } catch (err) {
      // Ignored
    }
  }

  public disconnect(): void {
    this.textQueue = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}
