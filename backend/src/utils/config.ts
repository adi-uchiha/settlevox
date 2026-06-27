import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, '../../.env.local') });
config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('3000'),
  BASE_URL: z.string().url().default('http://localhost:3000'),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  DATABASE_URL: z.string().url(),
  GEMINI_API_KEY: z.string().optional(),
  CARTESIA_API_KEY: z.string(),
  // Daniel
  CARTESIA_VOICE_ID: z.string().default('47c38ca4-5f35-497b-b1a3-415245fb35e1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const ENV = parsed.data;
