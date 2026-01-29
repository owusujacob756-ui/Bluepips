import { describe, it, expect, vi } from 'vitest';
import * as route from '../../src/app/api/analysis/technical/route.js';

// Mock the sql module used by the route
vi.mock('../../src/app/api/utils/sql', () => {
  return {
    __esModule: true,
    default: async function sqlTag(strings, ...args) {
      // Detect simple queries and return fake rows
      const q = strings[0];
      if (q.includes('FROM forex_pairs')) return [{ id: 1, symbol: 'EUR/USD' }];
      if (q.includes('FROM price_history')) return [];
      return [];
    }
  };
});

describe('Technical analysis route', () => {
  it('returns 200 and a result id when pair exists', async () => {
    const fakeRequest = { json: async () => ({ pair: 'EUR/USD', timeframe: '1H' }) };
    const res = await route.POST(fakeRequest);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('result');
    expect(body.result).toHaveProperty('recommendation');
  });
});