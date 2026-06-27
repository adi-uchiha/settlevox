import { db } from './src/db/index.js';
import { calls } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

const callId = process.argv[2];

if (!callId) {
  console.error('Error: call ID argument is required.\nUsage: npx tsx fetch-transcript.ts <call_id>');
  process.exit(1);
}

async function main() {
  const result = await db.select({ transcript: calls.transcript }).from(calls).where(eq(calls.call_id, callId as string)).limit(1);
  if (!result[0]) {
    console.error(`Error: No call found with ID: ${callId}`);
    process.exit(1);
  }
  console.log(JSON.stringify(result[0]?.transcript, null, 2));
  process.exit(0);
}

main().catch(console.error);
