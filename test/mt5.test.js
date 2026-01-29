// Use Vitest globals (describe/it/expect/vi) to avoid duplicate declarations

// Mock the sql helper used by mt5.js
vi.mock('../src/app/api/utils/sql.js', () => {
  // Create a sql tag function that can be used both to build fragments and to execute queries.
  function sqlTag(strings, ...args) {
    const q = strings.join(' ');
    // Return rows for known executed queries
    if (q.includes('SELECT current_price')) {
      return Promise.resolve([{ current_price: '1.23456' }]);
    }
    if (q.includes('SELECT * FROM mt5_orders')) {
      return Promise.resolve([
        { id: 1, order_id: 'ord-1', symbol: 'EUR/USD', status: 'open' },
      ]);
    }
    // For fragment building (e.g., sql`account_id = ${id}`), return a fragment object
    return { __frag: q, toString() { return q; } };
  }

  sqlTag.join = (arr, sep) => {
    return arr.map(a => (a && typeof a.toString === 'function' ? a.toString() : String(a))).join(' AND ');
  };

  sqlTag.transaction = async (fn) => {
    if (typeof fn === 'function') return fn(sqlTag);
    return [];
  };

  return { default: sqlTag };
});

import { getCurrentPrice, getOrderHistory } from '../src/lib/mt5.js';

describe('MT5 helpers', () => {
  it('returns current price for a symbol', async () => {
    const price = await getCurrentPrice('EUR/USD');
    expect(price).toBeCloseTo(1.23456, 5);
  });

  it('returns order history array', async () => {
    const history = await getOrderHistory({ accountId: 1, userId: 1, limit: 10 });
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]).toHaveProperty('order_id');
  });
});
import { describe, it, expect, vi } from 'vitest';

// Mock the sql helper used by mt5.js
vi.mock('../src/app/api/utils/sql.js', () => {
  // Create a sql tag function that can be used both to build fragments and to execute queries.
  function sqlTag(strings, ...args) {
    const q = strings.join(' ');
    // Return rows for known executed queries
    if (q.includes('SELECT current_price')) {
      return Promise.resolve([{ current_price: '1.23456' }]);
    }
    if (q.includes('SELECT * FROM mt5_orders')) {
      return Promise.resolve([
        { id: 1, order_id: 'ord-1', symbol: 'EUR/USD', status: 'open' },
      ]);
    }
    // For fragment building (e.g., sql`account_id = ${id}`), return a fragment object
    return { __frag: q, toString() { return q; } };
  }

  sqlTag.join = (arr, sep) => {
    return arr.map(a => (a && typeof a.toString === 'function' ? a.toString() : String(a))).join(' AND ');
  };

  sqlTag.transaction = async (fn) => {
    if (typeof fn === 'function') return fn(sqlTag);
    return [];
  };

  return { default: sqlTag };
});

import { getCurrentPrice, getOrderHistory } from '../src/lib/mt5.js';

describe('MT5 helpers', () => {
  it('returns current price for a symbol', async () => {
    const price = await getCurrentPrice('EUR/USD');
    expect(price).toBeCloseTo(1.23456, 5);
  });

  it('returns order history array', async () => {
    const history = await getOrderHistory({ accountId: 1, userId: 1, limit: 10 });
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]).toHaveProperty('order_id');
  });
});
