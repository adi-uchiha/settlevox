import { logger } from '../utils/logger.js';

export function checkGuardrails(text: string): { safe: boolean; reason?: string } {
  const lowercaseText = text.toLowerCase();
  
  // 1. Legal advice filtering
  const legalAdviceKeywords = [
    'i advise you',
    'you should sue',
    'definitely have a case',
    'guarantee',
    'your case is worth',
    'we will win',
    'legal opinion'
  ];

  for (const keyword of legalAdviceKeywords) {
    if (lowercaseText.includes(keyword)) {
      logger.warn({ keyword }, 'Guardrail triggered: Legal Advice');
      return { safe: false, reason: 'Generated text contains potential legal advice or guarantees.' };
    }
  }

  // 2. Medical diagnosis filtering
  const medicalKeywords = [
    'you have a concussion',
    'you need surgery',
    'diagnose',
    'treatment plan is'
  ];

  for (const keyword of medicalKeywords) {
    if (lowercaseText.includes(keyword)) {
      logger.warn({ keyword }, 'Guardrail triggered: Medical Diagnosis');
      return { safe: false, reason: 'Generated text contains potential medical diagnosis.' };
    }
  }

  return { safe: true };
}

export const FALLBACK_MESSAGE = "I'm sorry, as an AI assistant, I can't provide legal or medical advice. Our attorneys will be happy to discuss that with you.";
