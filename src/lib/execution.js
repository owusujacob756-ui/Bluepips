// Lightweight execution simulator/stub for broker integration
import { randomUUID } from 'crypto';

const executions = [];

export async function placeOrder({ pair, side = 'buy', size = 1000, price = null, userId = 1 }) {
  // In production, this would be an API call to a broker. Here we simulate.
  const id = randomUUID();
  const executedPrice = price || (Math.random() * (1.2 - 0.8) + 0.9).toFixed(5);
  const exec = { id, pair, side, size, price: executedPrice, userId, status: 'filled', createdAt: new Date().toISOString() };
  executions.push(exec);
  return exec;
}

export function getExecutions({ limit = 50 } = {}) {
  return executions.slice(-limit).reverse();
}
