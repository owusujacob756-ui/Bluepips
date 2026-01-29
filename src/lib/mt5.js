/**
 * MetaTrader 5 Integration Module
 * Handles real trading with MT5 brokers using REST API
 */

import sql from '../app/api/utils/sql.js';
import { BROKER_CONFIGS as MT5_BROKERS } from './mt5-config.js';


/**
 * Register MT5 Account
 */
export async function registerMT5Account({
  userId,
  accountLogin,
  accountPassword,
  brokerName = 'ICMarkets',
  accountType = 'live',
  accountBalance = 0,
}) {
  try {
    // Validate broker
    if (!MT5_BROKERS[brokerName]) {
      throw new Error(`Unsupported broker: ${brokerName}`);
    }

    // Store encrypted account credentials
    const result = await sql`
      INSERT INTO mt5_accounts (user_id, account_login, account_password, broker_name, account_type, account_balance, status, created_at)
      VALUES (${userId}, ${accountLogin}, ${accountPassword}, ${brokerName}, ${accountType}, ${accountBalance}, 'pending', NOW())
      RETURNING id, account_login, broker_name, account_type
    `;

    return result && result[0] ? result[0] : null;
  } catch (error) {
    console.error('MT5 Account Registration Error:', error);
    throw error;
  }
}

/**
 * Get MT5 Account
 */
export async function getMT5Account(accountId, userId) {
  try {
    const result = await sql`
      SELECT id, account_login, broker_name, account_type, account_balance, status, leverage
      FROM mt5_accounts
      WHERE id = ${accountId} AND user_id = ${userId}
    `;
    return result && result[0] ? result[0] : null;
  } catch (error) {
    console.error('Error fetching MT5 account:', error);
    throw error;
  }
}

/**
 * Get all MT5 Accounts for user
 */
export async function getUserMT5Accounts(userId) {
  try {
    const result = await sql`
      SELECT id, account_login, broker_name, account_type, account_balance, status, leverage
      FROM mt5_accounts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return result || [];
  } catch (error) {
    console.error('Error fetching MT5 accounts:', error);
    throw error;
  }
}

/**
 * Place Market Order on MT5
 */
export async function placeMarketOrder({
  accountId,
  userId,
  symbol,
  orderType, // 'buy' or 'sell'
  volume,
  stopLoss = null,
  takeProfit = null,
  comment = '',
}) {
  try {
    const account = await getMT5Account(accountId, userId);
    if (!account) throw new Error('MT5 Account not found');

    const broker = MT5_BROKERS[account.broker_name];
    if (!broker) throw new Error('Broker configuration not found');

    // Call broker API to place order
    const orderData = {
      symbol,
      orderType: orderType.toUpperCase(),
      volume,
      stopLoss,
      takeProfit,
      comment,
      accountLogin: account.account_login,
    };

    const response = await fetch(`${broker.apiUrl}/trade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${account.account_password}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Broker API Error: ${error.message}`);
    }

    const orderResult = await response.json();

    // Store order in database
    const dbOrder = await sql`
      INSERT INTO mt5_orders (
        account_id, user_id, symbol, order_type, volume, 
        stop_loss, take_profit, order_id, status, opened_at, comment
      )
      VALUES (
        ${accountId}, ${userId}, ${symbol}, ${orderType}, ${volume},
        ${stopLoss}, ${takeProfit}, ${orderResult.orderId}, 'open', NOW(), ${comment}
      )
      RETURNING id
    `;

    return {
      id: dbOrder && dbOrder[0] ? dbOrder[0].id : null,
      orderId: orderResult.orderId,
      symbol,
      orderType,
      volume,
      status: 'open',
      openTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error('MT5 Market Order Error:', error);
    throw error;
  }
}

/**
 * Place Pending Order on MT5
 */
export async function placePendingOrder({
  accountId,
  userId,
  symbol,
  orderType, // 'buylimit', 'selllimit', 'buystop', 'sellstop'
  volume,
  openPrice,
  stopLoss = null,
  takeProfit = null,
  comment = '',
  expiration = null,
}) {
  try {
    const account = await getMT5Account(accountId, userId);
    if (!account) throw new Error('MT5 Account not found');

    const broker = MT5_BROKERS[account.broker_name];
    if (!broker) throw new Error('Broker configuration not found');

    const orderData = {
      symbol,
      orderType: orderType.toUpperCase(),
      volume,
      openPrice,
      stopLoss,
      takeProfit,
      expiration,
      comment,
      accountLogin: account.account_login,
    };

    const response = await fetch(`${broker.apiUrl}/trade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${account.account_password}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Broker API Error: ${error.message}`);
    }

    const orderResult = await response.json();

    const dbOrder = await sql`
      INSERT INTO mt5_orders (
        account_id, user_id, symbol, order_type, volume, 
        open_price, stop_loss, take_profit, order_id, status, opened_at, comment, expiration
      )
      VALUES (
        ${accountId}, ${userId}, ${symbol}, ${orderType}, ${volume},
        ${openPrice}, ${stopLoss}, ${takeProfit}, ${orderResult.orderId}, 'pending', NOW(), ${comment}, ${expiration}
      )
      RETURNING id
    `;

    return {
      id: dbOrder && dbOrder[0] ? dbOrder[0].id : null,
      orderId: orderResult.orderId,
      symbol,
      orderType,
      volume,
      openPrice,
      status: 'pending',
      openTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error('MT5 Pending Order Error:', error);
    throw error;
  }
}

/**
 * Modify Order
 */
export async function modifyOrder({
  accountId,
  userId,
  orderId,
  stopLoss = null,
  takeProfit = null,
  openPrice = null,
}) {
  try {
    const account = await getMT5Account(accountId, userId);
    if (!account) throw new Error('MT5 Account not found');

    const broker = MT5_BROKERS[account.broker_name];
    if (!broker) throw new Error('Broker configuration not found');

    const modifyData = {
      orderId,
      stopLoss,
      takeProfit,
      openPrice,
    };

    const response = await fetch(`${broker.apiUrl}/trade/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${account.account_password}`,
      },
      body: JSON.stringify(modifyData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Broker API Error: ${error.message}`);
    }

    // Update in database
    await sql`
      UPDATE mt5_orders
      SET stop_loss = COALESCE(${stopLoss}, stop_loss),
          take_profit = COALESCE(${takeProfit}, take_profit),
          open_price = COALESCE(${openPrice}, open_price),
          modified_at = NOW()
      WHERE id = ${orderId} AND user_id = ${userId}
    `;

    return { success: true, orderId };
  } catch (error) {
    console.error('MT5 Order Modification Error:', error);
    throw error;
  }
}

/**
 * Close Order
 */
export async function closeOrder({
  accountId,
  userId,
  orderId,
  closePrice = null,
  comment = '',
}) {
  try {
    const account = await getMT5Account(accountId, userId);
    if (!account) throw new Error('MT5 Account not found');

    const broker = MT5_BROKERS[account.broker_name];
    if (!broker) throw new Error('Broker configuration not found');

    const response = await fetch(`${broker.apiUrl}/trade/${orderId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${account.account_password}`,
      },
      body: JSON.stringify({ closePrice, comment }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Broker API Error: ${error.message}`);
    }

    const closeResult = await response.json();

    // Update in database
    await sql`
      UPDATE mt5_orders
      SET status = 'closed',
          close_price = ${closePrice || closeResult.closePrice},
          closed_at = NOW(),
          modified_at = NOW()
      WHERE id = ${orderId} AND user_id = ${userId}
    `;

    return {
      orderId,
      status: 'closed',
      closePrice: closePrice || closeResult.closePrice,
      closeTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error('MT5 Order Close Error:', error);
    throw error;
  }
}

/**
 * Get Order History
 */
export async function getOrderHistory({
  accountId,
  userId,
  symbol = null,
  status = null,
  limit = 100,
  offset = 0,
}) {
  try {
    // Build WHERE conditions safely
    const conditions = [sql`account_id = ${accountId}`, sql`user_id = ${userId}`];
    if (symbol) conditions.push(sql`symbol = ${symbol}`);
    if (status) conditions.push(sql`status = ${status}`);

    // Compose final query
    const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

    const result = await sql`
      SELECT * FROM mt5_orders
      ${whereClause}
      ORDER BY opened_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return result || [];
  } catch (error) {
    console.error('Error fetching order history:', error);
    throw error;
  }
}

/**
 * Get Account Info
 */
export async function getAccountInfo(accountId, userId) {
  try {
    const account = await getMT5Account(accountId, userId);
    if (!account) throw new Error('MT5 Account not found');

    const broker = MT5_BROKERS[account.broker_name];
    if (!broker) throw new Error('Broker configuration not found');

    // Fetch account info from broker
    const response = await fetch(`${broker.apiUrl}/account/${account.account_login}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${account.account_password}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Broker API Error: ${error.message}`);
    }

    const accountInfo = await response.json();

    // Update account balance in database
    await sql`
      UPDATE mt5_accounts
      SET account_balance = ${accountInfo.balance},
          equity = ${accountInfo.equity},
          margin_used = ${accountInfo.margin},
          margin_free = ${accountInfo.freeMargin},
          modified_at = NOW()
      WHERE id = ${accountId} AND user_id = ${userId}
    `;

    return {
      accountLogin: account.account_login,
      broker: account.broker_name,
      balance: accountInfo.balance,
      equity: accountInfo.equity,
      marginUsed: accountInfo.margin,
      marginFree: accountInfo.freeMargin,
      marginLevel: accountInfo.marginLevel,
      leverage: account.leverage,
    };
  } catch (error) {
    console.error('MT5 Account Info Error:', error);
    throw error;
  }
}

/**
 * Get current market price for a symbol from `forex_pairs`.
 */
export async function getCurrentPrice(symbol) {
  try {
    const result = await sql`
      SELECT current_price FROM forex_pairs WHERE symbol = ${symbol}
      LIMIT 1
    `;
    if (!result || !result[0]) return null;
    return Number(result[0].current_price);
  } catch (error) {
    console.error('Error fetching current price:', error);
    return null;
  }
}

/**
 * Sync Open Orders with MT5
 */
export async function syncOpenOrders(accountId, userId) {
  try {
    const account = await getMT5Account(accountId, userId);
    if (!account) throw new Error('MT5 Account not found');

    const broker = MT5_BROKERS[account.broker_name];
    if (!broker) throw new Error('Broker configuration not found');

    // Fetch open orders from broker
    const response = await fetch(`${broker.apiUrl}/orders?status=open&account=${account.account_login}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${account.account_password}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Broker API Error: ${error.message}`);
    }

    const brokerOrders = await response.json();

    // Update local database with broker's open orders
    for (const order of brokerOrders) {
      await sql`
        INSERT INTO mt5_orders (
          account_id, user_id, symbol, order_type, volume,
          open_price, stop_loss, take_profit, order_id, status, opened_at
        )
        VALUES (
          ${accountId}, ${userId}, ${order.symbol}, ${order.type}, ${order.volume},
          ${order.openPrice}, ${order.stopLoss}, ${order.takeProfit},
          ${order.orderId}, ${order.status}, ${order.openTime}
        )
        ON CONFLICT (order_id) DO UPDATE SET
          open_price = ${order.openPrice},
          stop_loss = ${order.stopLoss},
          take_profit = ${order.takeProfit},
          modified_at = NOW()
      `;
    }

    return {
      synced: brokerOrders.length,
      orders: brokerOrders,
    };
  } catch (error) {
    console.error('MT5 Sync Orders Error:', error);
    throw error;
  }
}

/**
 * Execute Trade from Signal
 */
export async function executeTradeFromSignal({
  accountId,
  userId,
  signalData,
  riskPercentage = 2,
  maxLeverage = 10,
}) {
  try {
    const account = await getMT5Account(accountId, userId);
    if (!account) throw new Error('MT5 Account not found');

    const { symbol, direction, entryPrice, stopLoss, takeProfit, confidence } = signalData;

    // Calculate position size based on risk
    const accountInfo = await getAccountInfo(accountId, userId);
    const riskAmount = (accountInfo.balance * riskPercentage) / 100;
    const pips = Math.abs(entryPrice - stopLoss);
    const volume = Math.min(
      (riskAmount / pips) * 0.0001,
      (accountInfo.balance * maxLeverage) / entryPrice
    );

    // Place market order
    const order = await placeMarketOrder({
      accountId,
      userId,
      symbol,
      orderType: direction.toLowerCase(),
      volume: Math.round(volume * 1000) / 1000,
      stopLoss,
      takeProfit,
      comment: `Signal: ${symbol} ${direction} (Confidence: ${confidence}%)`,
    });

    return order;
  } catch (error) {
    console.error('MT5 Signal Execution Error:', error);
    throw error;
  }
}

export { MT5_BROKERS };
