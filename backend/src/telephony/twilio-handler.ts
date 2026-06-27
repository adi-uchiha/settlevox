import type { Request, Response } from 'express';
import twilio from 'twilio';
import { ENV } from '../utils/config';
import { logger } from '../utils/logger';

const twilioClient = twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);

export async function handleTwilioRequestCall(req: Request, res: Response) {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    logger.info({ phoneNumber }, 'Initiating outbound call via Twilio');

    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: ENV.TWILIO_PHONE_NUMBER,
      url: `${ENV.BASE_URL}/api/voice`, // Webhook when callee answers
      statusCallback: `${ENV.BASE_URL}/api/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: true,
    });

    return res.json({ callSid: call.sid, status: 'initiated' });
  } catch (error) {
    logger.error({ error }, 'Failed to initiate call');
    return res.status(500).json({ error: 'Failed to initiate call' });
  }
}

export function handleTwilioVoice(req: Request, res: Response) {
  logger.info({ body: req.body }, 'Received /api/voice webhook from Twilio');
  
  const fromPhone = req.body.From === ENV.TWILIO_PHONE_NUMBER 
    ? (req.body.To || 'Unknown') 
    : (req.body.From || 'Unknown');
    
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Extract host without protocol for WebSocket URL
  const host = new URL(ENV.BASE_URL).host;
  const wsUrl = `wss://${host}/ws/media-stream`;
  
  const connect = twiml.connect();
  const stream = connect.stream({
    url: wsUrl,
    name: 'ai-agent-stream',
  });
  stream.parameter({ name: 'phone', value: fromPhone });
  
  res.type('text/xml');
  res.send(twiml.toString());
}

export async function handleTwilioEndCall(req: Request, res: Response) {
  try {
    const { callSid } = req.body;
    if (!callSid) {
      return res.status(400).json({ error: 'CallSid is required' });
    }
    
    logger.info({ callSid }, 'Terminating call via Twilio API');
    await twilioClient.calls(callSid).update({ status: 'completed' });
    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to terminate call');
    return res.status(500).json({ error: 'Failed to terminate call' });
  }
}
