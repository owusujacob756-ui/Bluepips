import { describe, it, expect } from 'vitest';
import { analyzeTechnical, analyzeFundamental } from '../src/lib/ai.js';

describe('AI helpers', () => {
  it('returns neutral stub when no API key', async () => {
    const tech = await analyzeTechnical({ pair: 'EUR/USD', timeframe: '1H', priceHistory: [] });
    expect(tech).toHaveProperty('recommendation');
    expect(tech.recommendation).toBe('hold');

    const fund = await analyzeFundamental({ pair: 'EUR/USD', newsItems: [] });
    expect(fund).toHaveProperty('sentiment');
    // stub returns neutral or hold-based object
    expect(['neutral','bullish','bearish','hold']).toContain(fund.sentiment || fund.recommendation);
  });
});
