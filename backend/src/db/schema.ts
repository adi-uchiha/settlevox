import { pgTable, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const calls = pgTable('calls', {
  call_id: text('call_id').primaryKey(),
  phone_number: text('phone_number').notNull(),
  started_at: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  ended_at: timestamp('ended_at', { withTimezone: true, mode: 'string' }),
  duration_seconds: integer('duration_seconds'),
  status: text('status'),
  final_phase: text('final_phase'),
  ai_summary: text('ai_summary'),
  transcript: jsonb('transcript').default([]),
  extracted_data: jsonb('extracted_data').default({}),
  sentiment: text('sentiment'),
  recording_url: text('recording_url'),
  cms_id: text('cms_id'),
});
