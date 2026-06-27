import { randomUUID } from 'crypto';
import { db } from '../db/index.js';
import { calls } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export interface CallRecord {
  call_id: string;
  phone_number: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  status: 'initiated' | 'ringing' | 'completed' | 'incomplete' | 'error';
  final_phase?: string;
  ai_summary?: string;
  transcript: { speaker: 'agent' | 'caller'; text: string; timestamp: number }[];
  extracted_data?: Record<string, any>;
  sentiment?: 'positive' | 'neutral' | 'negative';
  recording_url?: string | null;
  cms_id?: string | null;
}

export async function createCall(data: Partial<CallRecord>): Promise<CallRecord> {
  const call_id = data.call_id || `CA_${randomUUID()}`;
  
  const insertData = {
    call_id,
    phone_number: data.phone_number || '',
    started_at: data.started_at || new Date().toISOString(),
    status: data.status || 'initiated',
    transcript: data.transcript || [],
    ...data,
  };
  
  await db.insert(calls).values(insertData);
  return insertData as CallRecord;
}

export async function updateCall(callId: string, data: Partial<CallRecord>): Promise<void> {
  await db.update(calls).set(data).where(eq(calls.call_id, callId));
}

export async function getCallById(callId: string): Promise<CallRecord | undefined> {
  const result = await db.select().from(calls).where(eq(calls.call_id, callId)).limit(1);
  return result[0] as CallRecord | undefined;
}

export async function getCalls(): Promise<Partial<CallRecord>[]> {
  const result = await db.select().from(calls).orderBy(desc(calls.started_at));
  return result.map(c => {
    const { transcript, ...summary } = c;
    return summary as Partial<CallRecord>;
  });
}

export async function getStats() {
  const allCalls = await db.select({
    duration_seconds: calls.duration_seconds,
    extracted_data: calls.extracted_data,
    final_phase: calls.final_phase,
  }).from(calls);
  const totalCalls = allCalls.length;
  const answeredCalls = allCalls.filter(c => c.duration_seconds && c.duration_seconds > 0).length;
  
  let totalDuration = 0;
  let qualifiedCount = 0;
  let completedCount = 0;

  allCalls.forEach(c => {
    totalDuration += c.duration_seconds || 0;
    const extractedData = c.extracted_data as any;
    if (extractedData?.is_qualified) qualifiedCount++;
    if (c.final_phase === 'WRAP_UP') completedCount++;
  });

  const talkTimeMinutes = Math.floor(totalDuration / 60);
  
  return {
    totalCalls,
    answeredCalls,
    talkTimeMinutes,
    timeSavedMinutes: totalCalls * 15,
    qualificationRate: totalCalls ? Math.round((qualifiedCount / totalCalls) * 100) : 0,
    completionRate: totalCalls ? Math.round((completedCount / totalCalls) * 100) : 0,
    transferAnswerRate: totalCalls ? Math.round((answeredCalls / totalCalls) * 100) : 0,
  };
}
