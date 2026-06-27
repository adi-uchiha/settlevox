import { ENV } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import Cartesia from '@cartesia/cartesia-js';

export class SpeechToText extends EventEmitter {
  private cartesia: Cartesia;
  private ws: any = null;
  private isConnected = false;
  private audioBufferQueue: Buffer[] = [];
  private intendedDisconnect = false;

  constructor() {
    super();
    this.cartesia = new Cartesia({ apiKey: ENV.CARTESIA_API_KEY });
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info('Connecting to Cartesia STT (Ink-2 AutoFinalize)...');

      try {
        // Native Cartesia v3 SDK implementation
        this.ws = this.cartesia.stt.autoFinalize.websocket({
          model: 'ink-2',
          encoding: 'pcm_mulaw',
          sample_rate: 8000,
        });

        this.ws.on('connected', () => {
          this.isConnected = true;
          logger.info('Cartesia STT connection opened');
          
          // Flush buffered audio chunks
          while (this.audioBufferQueue.length > 0) {
            const chunk = this.audioBufferQueue.shift();
            if (chunk) {
              this.ws.sendRaw(chunk);
            }
          }
          
          this.emit('connected');
          resolve();
        });

        this.ws.on('close', () => {
          this.isConnected = false;
          logger.info('Cartesia STT connection closed');
          this.emit('disconnected');
          if (!this.intendedDisconnect) {
            logger.warn('Cartesia STT disconnected unexpectedly. Reconnecting...');
            setTimeout(() => {
              this.connect().catch(e => logger.error({ err: e }, 'Failed to reconnect STT'));
            }, 500);
          }
        });

        this.ws.on('error', (err: any) => {
          logger.error({ err }, 'Cartesia STT WebSocket error');
          this.emit('error', err);
          if (!this.isConnected) {
            reject(err);
          }
        });

        this.ws.on('turn.update', (msg: any) => {
          if (msg.transcript && msg.transcript.trim() !== '') {
            this.emit('interim_transcript', msg.transcript.trim());
          }
        });

        this.ws.on('turn.end', (msg: any) => {
          if (msg.transcript && msg.transcript.trim() !== '') {
            logger.debug({ transcript: msg.transcript }, 'Cartesia STT final transcript');
            this.emit('final_transcript', msg.transcript.trim());
          }
        });
      } catch (err) {
        logger.error({ err }, 'Failed to initialize Cartesia STT');
        reject(err);
      }
    });
  }

  public sendAudio(audioPayload: Buffer): void {
    if (this.isConnected && this.ws) {
      this.ws.sendRaw(audioPayload);
    } else {
      this.audioBufferQueue.push(audioPayload);
    }
  }

  public disconnect(): void {
    this.intendedDisconnect = true;
    this.audioBufferQueue = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}
