import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

async function run() {
  console.log('Hammering gemini-2.5-flash-lite...');
  let success = 0;
  for (let i = 0; i < 55; i++) {
    try {
      await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ role: 'user', parts: [{ text: 'Say yes.' }] }]
      });
      success++;
      console.log(`Request ${i + 1} succeeded`);
    } catch (err: any) {
      console.log(`Request ${i + 1} failed:`, err.status, err.message?.substring(0, 50));
    }
  }
  console.log(`Total successes for lite: ${success}/7`);
}

run();
