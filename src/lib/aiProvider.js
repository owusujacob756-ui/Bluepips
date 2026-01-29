import * as openai from './ai.js';
import * as anthropic from './anthropic.js';
import * as gemini from './gemini.js';

const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

export async function analyzeTechnical(opts) {
  if (provider === 'openai') return openai.analyzeTechnical(opts);
  if (provider === 'anthropic') return anthropic.analyzeTechnical(opts);
  if (provider === 'gemini') return gemini.analyzeTechnical(opts);
  // fallback
  return openai.analyzeTechnical(opts);
}

export async function analyzeFundamental(opts) {
  if (provider === 'openai') return openai.analyzeFundamental(opts);
  if (provider === 'anthropic') return anthropic.analyzeFundamental(opts);
  if (provider === 'gemini') return gemini.analyzeFundamental(opts);
  // fallback
  return openai.analyzeFundamental(opts);
}
