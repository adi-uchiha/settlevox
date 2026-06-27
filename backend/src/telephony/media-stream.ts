import http from 'http';
import { WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { Orchestrator } from '../pipeline/orchestrator.js';

export function handleMediaStream(ws: WebSocket, req: http.IncomingMessage) {
  let streamSid: string | null = null;
  let orchestrator: Orchestrator | null = null;
  
  const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const phone = urlObj.searchParams.get('phone') || 'Unknown';
  
  ws.on('message', (message: string) => {
    try {
      const msg = JSON.parse(message);
      
      switch (msg.event) {
        case 'start':
          streamSid = msg.start.streamSid;
          const callSid = msg.start.callSid || streamSid;
          const phoneParam = msg.start.customParameters?.phone || phone;
          
          logger.info({ streamSid, callSid, phone: phoneParam }, 'Twilio Media Stream started');
          orchestrator = new Orchestrator(ws, streamSid as string, callSid as string, phoneParam as string);
          void orchestrator.start();
          break;
        case 'media':
          if (orchestrator && msg.media.payload) {
            orchestrator.receiveAudio(Buffer.from(msg.media.payload, 'base64'));
          }
          break;
        case 'stop':
          logger.info({ streamSid }, 'Twilio Media Stream stopped');
          break;
        case 'mark':
          if (orchestrator) orchestrator.handleMark(msg.mark.name);
          break;
      }
    } catch (e) {
      logger.error({ error: e }, 'Failed to parse WebSocket message from Twilio');
    }
  });

  ws.on('close', () => {
    logger.info({ streamSid }, 'Twilio Media Stream closed');
    if (orchestrator) orchestrator.destroy();
    ws.removeAllListeners();
  });

  ws.on('error', (error) => {
    logger.error({ error, streamSid }, 'Twilio Media Stream error');
    if (orchestrator) orchestrator.destroy();
    ws.removeAllListeners();
  });
}
