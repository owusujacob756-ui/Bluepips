import { describe, it, expect, beforeEach } from 'vitest';
import { fetchNewsForPair, _test_clearCache } from '../src/lib/news.js';

describe('News provider', () => {
  beforeEach(() => { _test_clearCache(); });

  it('returns stub when no key', async () => {
    const res = await fetchNewsForPair('EUR/USD');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0]).toHaveProperty('title');
  });
});
