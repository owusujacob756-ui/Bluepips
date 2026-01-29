import { describe, it, expect } from 'vitest';
import * as gemini from '../src/lib/gemini.js';

describe('Gemini adapter', () => {
  it('returns stub when key missing (technical)', async () => {
    delete process.env.GOOGLE_GEMINI_KEY;
    const res = await gemini.analyzeTechnical({ pair: 'EUR/USD', timeframe: '1H', priceHistory: [] });
    expect(res).toHaveProperty('recommendation');
    expect(res.summary).toContain('Gemini key not set');
  });

  it('returns stub when key missing (fundamental)', async () => {
    delete process.env.GOOGLE_GEMINI_KEY;
    const res = await gemini.analyzeFundamental({ pair: 'EUR/USD', newsItems: [] });
    expect(res).toHaveProperty('sentiment');
    expect(res.summary).toContain('Gemini key not set');
  });
});