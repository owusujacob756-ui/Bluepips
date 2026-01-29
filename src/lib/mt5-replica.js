/**
 * MT5 Replica Simulator
 * A complete, self-contained trading simulator that mimics MetaTrader 5 functionality.
 * Uses in-memory state for demo accounts, live price simulation, and order execution.
 */

import { randomUUID } from 'crypto';

// ============================================================================
// In-Memory Replica State (can be extended to use database)
// ============================================================================

const replicaAccounts = new Map(); // accountId -> account data
const replicaOrders = new Map(); // orderId -> order data
const replicaPositions = new Map(); // positionId -> position data
const priceFeeds = new Map(); // symbol -> current price + history
const accountBalances = new Map(); // accountId -> balance
const tradeHistory = new Map(); // accountId -> trades[]

// ============================================================================
// Price Feed Simulator
// ============================================================================

const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'XAUUSD'];

const initialPrices = {
  'EUR/USD': 1.08450,
  'GBP/USD': 1.26320,
  'USD/JPY': 149.850,
  'AUD/USD': 0.66240,
  'USD/CHF': 0.88560,
  'XAUUSD': 2050.00,
};

function initializePriceFeed() {
  for (const symbol of SYMBOLS) {
    priceFeeds.set(symbol, {
      current: initialPrices[symbol] || 1.0,
      bid: (initialPrices[symbol] || 1.0) - 0.0002,
      ask: (initialPrices[symbol] || 1.0) + 0.0002,
      high: initialPrices[symbol] || 1.0,
      low: initialPrices[symbol] || 1.0,
      history: [],
      lastUpdate: Date.now(),
    });
  }
}

/**
 * Simulate market price movement (random walk)
 */
function updatePrices() {
  for (const [symbol, feed] of priceFeeds) {
    const change = (Math.random() - 0.5) * 0.0010; // ±0.005 pips
    const newPrice = feed.current + change;
    feed.current = Math.max(0.0001, newPrice); // prevent negative prices
    feed.bid = feed.current - 0.0002;
    feed.ask = feed.current + 0.0002;
    feed.high = Math.max(feed.high, feed.current);
    feed.low = Math.min(feed.low, feed.current);
    feed.lastUpdate = Date.now();

    // Store history (keep last 1000 ticks)
    feed.history.push({
      price: feed.current,
      timestamp: Date.now(),
      bid: feed.bid,
      ask: feed.ask,
    });
    if (feed.history.length > 1000) {
      feed.history.shift();
    }
  }
}

// Start price update loop
let priceUpdateInterval = null;
function startPriceUpdates() {
  if (priceUpdateInterval) return;
  initializePriceFeed();
  priceUpdateInterval = setInterval(updatePrices, 1000); // Update every second
}

function stopPriceUpdates() {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
    priceUpdateInterval = null;
  }
}

// ============================================================================
// Replica Account Management
// ============================================================================

export function createReplicaAccount({
  userId,
  accountName = 'Demo Account',
  balance = 10000,
  leverage = 100,
}) {
  const accountId = randomUUID();
  const account = {
    id: accountId,
    userId,
    name: accountName,
    balance,
    equity: balance,
    margin: 0,
    marginFree: balance,
    marginLevel: 0,
    leverage,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  replicaAccounts.set(accountId, account);
  accountBalances.set(accountId, balance);
  tradeHistory.set(accountId, []);
  return account;
}

export function getReplicaAccount(accountId) {
  return replicaAccounts.get(accountId) || null;
}

export function listReplicaAccounts(userId) {
  return Array.from(replicaAccounts.values()).filter(
    (acc) => acc.userId === userId
  );
}

export function updateAccountBalance(accountId, newBalance) {
  if (!replicaAccounts.has(accountId)) return null;
  const account = replicaAccounts.get(accountId);
  account.balance = newBalance;
  account.equity = newBalance; // simplified: equity = balance + P&L
  account.marginFree = newBalance - account.margin;
  account.marginLevel =
    account.margin > 0 ? ((newBalance / account.margin) * 100).toFixed(2) : 0;
  account.updatedAt = new Date().toISOString();
  accountBalances.set(accountId, newBalance);
  return account;
}

// ============================================================================
// Replica Order Execution
// ============================================================================

export function placeMarketOrder({
  accountId,
  symbol,
  side, // 'buy' or 'sell'
  volume,
  stopLoss = null,
  takeProfit = null,
  comment = '',
}) {
  if (!replicaAccounts.has(accountId)) {
    throw new Error('Account not found');
  }

  const account = replicaAccounts.get(accountId);
  const feed = priceFeeds.get(symbol);
  if (!feed) {
    throw new Error(`Symbol ${symbol} not supported`);
  }

  const orderId = randomUUID();
  const executionPrice = side === 'buy' ? feed.ask : feed.bid;

  // Calculate margin requirement (simplified)
  const marginRequired = (executionPrice * volume) / account.leverage;
  const availableMargin = account.marginFree;

  if (marginRequired > availableMargin) {
    throw new Error('Insufficient margin');
  }

  const order = {
    id: orderId,
    accountId,
    symbol,
    type: 'market',
    side,
    volume,
    openPrice: executionPrice,
    bid: feed.bid,
    ask: feed.ask,
    stopLoss,
    takeProfit,
    status: 'filled', // market orders execute immediately
    comment,
    openTime: new Date().toISOString(),
    profit: 0,
    profitPercent: 0,
  };

  replicaOrders.set(orderId, order);

  // Update account margin
  account.margin += marginRequired;
  account.marginFree -= marginRequired;
  account.marginLevel = ((account.equity / account.margin) * 100).toFixed(2);

  return order;
}

export function placePendingOrder({
  accountId,
  symbol,
  side,
  volume,
  openPrice,
  stopLoss = null,
  takeProfit = null,
  comment = '',
  expiresAt = null,
}) {
  if (!replicaAccounts.has(accountId)) {
    throw new Error('Account not found');
  }

  if (!priceFeeds.has(symbol)) {
    throw new Error(`Symbol ${symbol} not supported`);
  }

  const orderId = randomUUID();
  const account = replicaAccounts.get(accountId);
  const marginRequired = (openPrice * volume) / account.leverage;

  const order = {
    id: orderId,
    accountId,
    symbol,
    type: 'pending',
    side,
    volume,
    openPrice,
    stopLoss,
    takeProfit,
    status: 'pending',
    comment,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  replicaOrders.set(orderId, order);
  return order;
}

export function modifyOrder(orderId, { stopLoss = null, takeProfit = null }) {
  const order = replicaOrders.get(orderId);
  if (!order) throw new Error('Order not found');

  if (stopLoss !== null) order.stopLoss = stopLoss;
  if (takeProfit !== null) order.takeProfit = takeProfit;
  order.updatedAt = new Date().toISOString();

  return order;
}

export function closeOrder(orderId, closePrice = null) {
  const order = replicaOrders.get(orderId);
  if (!order) throw new Error('Order not found');

  const feed = priceFeeds.get(order.symbol);
  const actualClosePrice = closePrice || (order.side === 'buy' ? feed.bid : feed.ask);

  const pnl =
    order.side === 'buy'
      ? (actualClosePrice - order.openPrice) * order.volume
      : (order.openPrice - actualClosePrice) * order.volume;

  const pnlPercent = (pnl / (order.openPrice * order.volume)) * 100;

  order.closePrice = actualClosePrice;
  order.closeTime = new Date().toISOString();
  order.status = 'closed';
  order.profit = pnl;
  order.profitPercent = pnlPercent;

  // Update account balance and margin
  const account = replicaAccounts.get(order.accountId);
  const marginRequired = (order.openPrice * order.volume) / account.leverage;
  account.balance += pnl;
  account.equity = account.balance;
  account.margin -= marginRequired;
  account.marginFree += marginRequired;
  if (account.margin > 0) {
    account.marginLevel = ((account.equity / account.margin) * 100).toFixed(2);
  }

  // Store in trade history
  const history = tradeHistory.get(order.accountId) || [];
  history.push(order);
  tradeHistory.set(order.accountId, history);

  return order;
}

export function getOrder(orderId) {
  return replicaOrders.get(orderId) || null;
}

export function listOrders(accountId, options = {}) {
  const { status = null, symbol = null, limit = 100, offset = 0 } = options;

  let orders = Array.from(replicaOrders.values()).filter(
    (o) => o.accountId === accountId
  );

  if (status) orders = orders.filter((o) => o.status === status);
  if (symbol) orders = orders.filter((o) => o.symbol === symbol);

  return orders.slice(offset, offset + limit);
}

// ============================================================================
// Market Data & Price Feed
// ============================================================================

export function getMarketPrice(symbol) {
  const feed = priceFeeds.get(symbol);
  if (!feed) return null;
  return {
    symbol,
    current: feed.current,
    bid: feed.bid,
    ask: feed.ask,
    high: feed.high,
    low: feed.low,
    timestamp: feed.lastUpdate,
  };
}

export function listMarketPrices() {
  return Array.from(priceFeeds.entries()).map(([symbol, feed]) => ({
    symbol,
    current: feed.current,
    bid: feed.bid,
    ask: feed.ask,
    high: feed.high,
    low: feed.low,
    timestamp: feed.lastUpdate,
  }));
}

export function getPriceHistory(symbol, limit = 100) {
  const feed = priceFeeds.get(symbol);
  if (!feed) return [];
  return feed.history.slice(-limit);
}

// ============================================================================
// Positions & Performance
// ============================================================================

export function getAccountPositions(accountId) {
  return Array.from(replicaOrders.values())
    .filter((o) => o.accountId === accountId && o.status === 'filled')
    .map((order) => {
      const feed = priceFeeds.get(order.symbol);
      const currentPrice = order.side === 'buy' ? feed.bid : feed.ask;
      const pnl =
        order.side === 'buy'
          ? (currentPrice - order.openPrice) * order.volume
          : (order.openPrice - currentPrice) * order.volume;
      const pnlPercent =
        ((currentPrice - order.openPrice) / order.openPrice) * 100;

      return {
        ...order,
        currentPrice,
        profit: pnl,
        profitPercent: pnlPercent,
      };
    });
}

export function getTradeHistory(accountId, limit = 100) {
  const history = tradeHistory.get(accountId) || [];
  return history.slice(-limit).reverse();
}

export function getAccountStats(accountId) {
  const account = replicaAccounts.get(accountId);
  if (!account) return null;

  const history = tradeHistory.get(accountId) || [];
  const winningTrades = history.filter((t) => t.profit > 0).length;
  const losingTrades = history.filter((t) => t.profit < 0).length;
  const totalProfit = history.reduce((sum, t) => sum + (t.profit || 0), 0);
  const avgProfit = history.length > 0 ? totalProfit / history.length : 0;

  return {
    accountId,
    accountName: account.name,
    balance: account.balance,
    equity: account.equity,
    margin: account.margin,
    marginFree: account.marginFree,
    marginLevel: account.marginLevel,
    leverage: account.leverage,
    totalTrades: history.length,
    winningTrades,
    losingTrades,
    winRate:
      history.length > 0 ? ((winningTrades / history.length) * 100).toFixed(2) : 0,
    totalProfit,
    avgProfit: avgProfit.toFixed(2),
    bestTrade: Math.max(
      ...(history.map((t) => t.profit || 0).length > 0
        ? history.map((t) => t.profit || 0)
        : [0])
    ),
    worstTrade: Math.min(
      ...(history.map((t) => t.profit || 0).length > 0
        ? history.map((t) => t.profit || 0)
        : [0])
    ),
  };
}

// ============================================================================
// Initialization & Cleanup
// ============================================================================

export function initializeReplica() {
  startPriceUpdates();
  console.log('[MT5 Replica] Simulator initialized');
}

export function cleanupReplica() {
  stopPriceUpdates();
  replicaAccounts.clear();
  replicaOrders.clear();
  replicaPositions.clear();
  priceFeeds.clear();
  accountBalances.clear();
  tradeHistory.clear();
  console.log('[MT5 Replica] Simulator cleaned up');
}

// Auto-initialize on module load (optional)
if (typeof window === 'undefined') {
  // Only initialize in Node.js (server), not in browser
  initializeReplica();
}

export default {
  // Accounts
  createReplicaAccount,
  getReplicaAccount,
  listReplicaAccounts,
  updateAccountBalance,

  // Orders
  placeMarketOrder,
  placePendingOrder,
  modifyOrder,
  closeOrder,
  getOrder,
  listOrders,

  // Market Data
  getMarketPrice,
  listMarketPrices,
  getPriceHistory,

  // Positions & Performance
  getAccountPositions,
  getTradeHistory,
  getAccountStats,

  // Lifecycle
  initializeReplica,
  cleanupReplica,
};
