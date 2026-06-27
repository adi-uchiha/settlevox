import express from 'express';
import http from 'http';
import cors from 'cors';
import { Readable } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { ENV } from './utils/config';
import { logger } from './utils/logger';
import { handleTwilioVoice, handleTwilioRequestCall, handleTwilioEndCall } from './telephony/twilio-handler.js';
import { handleMediaStream } from './telephony/media-stream.js';
import { getCalls, getCallById, getStats, updateCall } from './integrations/db.js';
import type { CallRecord } from './integrations/db.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Web portal endpoints
app.post('/api/request-call', handleTwilioRequestCall);
app.post('/api/end-call', handleTwilioEndCall);

// Twilio webhook endpoints
app.post('/api/voice', handleTwilioVoice);

// In-memory store for SSE clients listening to call status
const sseClients: Record<string, { res: express.Response; connectedAt: number }> = {};

// Clean up stale SSE connections older than 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  for (const [callSid, client] of Object.entries(sseClients)) {
    if (now - client.connectedAt > TEN_MINUTES) {
      try {
        client.res.end();
      } catch (err) {
        // ignore
      }
      delete sseClients[callSid];
    }
  }
}, 60000);

app.post('/api/call-status', async (req, res) => {
  const { CallSid, CallStatus, RecordingUrl } = req.body;
  logger.info({ CallSid, CallStatus, RecordingUrl }, 'Received Twilio call status update');

  if (CallSid) {
    const validStatuses: CallRecord['status'][] = ['initiated', 'ringing', 'completed', 'incomplete', 'error'];
    const status = validStatuses.includes(CallStatus) ? CallStatus as CallRecord['status'] : 'incomplete';
    
    if (CallStatus === 'completed' && RecordingUrl) {
      await updateCall(CallSid, { recording_url: RecordingUrl, status });
    } else {
      await updateCall(CallSid, { status });
    }
  }
  
  if (CallSid && sseClients[CallSid]) {
    sseClients[CallSid].res.write(`data: ${JSON.stringify({ status: CallStatus })}\n\n`);
    
    // Clean up if call is done
    if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus)) {
      sseClients[CallSid].res.end();
      delete sseClients[CallSid];
    }
  }
  
  res.sendStatus(200);
});

// SSE endpoint for the frontend to listen to call status updates
app.get('/api/call-status/:callSid', (req, res) => {
  const { callSid } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial ping
  res.write(`data: ${JSON.stringify({ status: 'connected_to_sse' })}\n\n`);
  
  sseClients[callSid] = { res, connectedAt: Date.now() };
  
  req.on('close', () => {
    if (sseClients[callSid]) {
      delete sseClients[callSid];
    }
  });
});

// Dashboard endpoints
app.get('/api/calls', async (req, res) => {
  const calls = await getCalls();
  res.json(calls);
});

app.get('/api/calls/:id', async (req, res) => {
  const call = await getCallById(req.params.id);
  if (!call) return res.status(404).json({ error: 'Call not found' });
  res.json(call);
});

app.get('/api/calls/:id/recording', async (req, res) => {
  try {
    const call = await getCallById(req.params.id);
    if (!call || !call.recording_url) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    let url = call.recording_url;
    if (!url.endsWith('.mp3')) url += '.mp3';

    const auth = Buffer.from(`${ENV.TWILIO_ACCOUNT_SID}:${ENV.TWILIO_AUTH_TOKEN}`).toString('base64');
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch recording from Twilio');
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
    
    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    logger.error({ err }, 'Error fetching recording');
    res.status(500).json({ error: 'Failed to fetch recording' });
  }
});

app.get('/api/stats', async (req, res) => {
  const stats = await getStats();
  res.json(stats);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/media-stream' });

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  logger.info('WebSocket connection opened from Twilio');
  handleMediaStream(ws, req);
});

server.listen(ENV.PORT, () => {
  logger.info(`SettleVox Server running on port ${ENV.PORT}`);
  logger.info(`Dashboard API available at /api/calls and /api/stats`);
});

// Graceful shutdown on SIGTERM/SIGINT — prevents in-flight calls from being abruptly killed
const shutdown = () => {
  logger.info('Received shutdown signal. Closing server...');
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed.');
  });
  
  // Close the WebSocket server
  wss.close(() => {
    logger.info('WebSocket server closed.');
  });

  // Close all SSE connections
  for (const [, client] of Object.entries(sseClients)) {
    try { client.res.end(); } catch (_) { /* ignore */ }
  }
  
  // Give active orchestrators up to 10 seconds to finish call cleanup
  setTimeout(() => {
    logger.info('Shutdown complete.');
    process.exit(0);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
