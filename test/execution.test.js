import { describe, it, expect } from 'vitest';
import { placeOrder, getExecutions } from '../src/lib/execution.js';

describe('Execution stub', () => {
  it('places an order and returns execution', async () => {
    const exec = await placeOrder({ pair: 'EUR/USD', side: 'buy', size: 1000 });
    expect(exec).toHaveProperty('id');
    expect(exec.status).toBe('filled');
    const list = getExecutions({ limit: 10 });
    expect(list.length).toBeGreaterThanOrEqual(1);
  });
});