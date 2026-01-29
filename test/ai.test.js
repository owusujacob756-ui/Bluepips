import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeTechnical, analyzeFundamental, _test_clearCache, _test_getMetrics } from '../src/lib/ai.js';

describe('AI provider', () => {
  beforeEach(() => {
    _test_clearCache();
  });

  it('returns stub when no key', async () => {
    const tech = await analyzeTechnical({ pair: 'EUR/USD', timeframe: '1H', priceHistory: [] });
    expect(tech).toHaveProperty('recommendation');
    expect(tech.recommendation).toBe('hold');

    const fund = await analyzeFundamental({ pair: 'EUR/USD', newsItems: [] });
    expect(fund).toHaveProperty('sentiment');
    expect(fund.sentiment).toBe('neutral');
  });

  it('exposes metrics helper', () => {
    const metrics = _test_getMetrics();
    expect(metrics).toHaveProperty('calls');
    expect(metrics).toHaveProperty('errors');
    expect(metrics).toHaveProperty('concurrent');
  });
});
