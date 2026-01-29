/**
 * MT5 Automated Trading Engine
 * Automatically executes trades based on analysis signals
 * Integrates with the analysis and execution modules
 */

import sql from '../app/api/utils/sql.js';
import {
  executeTradeFromSignal,
  getAccountInfo,
  modifyOrder,
  closeOrder,
  getCurrentPrice,
} from './mt5.js';
import { validateTradeParameters } from './mt5-config.js';

/**
 * Trading Bot Configuration
 */
export class MT5TradingBot {
  constructor(accountId, userId) {
    this.accountId = accountId;
    this.userId = userId;
    this.isRunning = false;
    this.checkInterval = 60000; // 1 minute
    this.maxConcurrentTrades = 5;
    this.riskPercentage = 2;
    this.maxLeverage = 10;
  }

  /**
   * Start trading bot
   */
  async start() {
    this.isRunning = true;
    console.log(`[MT5 Bot] Starting trading bot for account ${this.accountId}`);

    // Save bot status
    await sql`
      INSERT INTO mt5_bot_status (account_id, user_id, status, started_at, last_activity)
      VALUES (${this.accountId}, ${this.userId}, 'running', NOW(), NOW())
      ON CONFLICT (account_id) DO UPDATE SET status = 'running', started_at = NOW()
    `;

    this.botLoop();
  }

  /**
   * Stop trading bot
   */
  async stop() {
    this.isRunning = false;
    console.log(`[MT5 Bot] Stopping trading bot for account ${this.accountId}`);

    await sql`
      UPDATE mt5_bot_status
      SET status = 'stopped', stopped_at = NOW()
      WHERE account_id = ${this.accountId} AND user_id = ${this.userId}
    `;
  }

  /**
   * Main bot loop
   */
  async botLoop() {
    while (this.isRunning) {
      try {
        await this.checkAndExecuteSignals();
        await this.manageOpenPositions();
        await this.updateBotActivity();
        await new Promise(resolve => setTimeout(resolve, this.checkInterval));
      } catch (error) {
        console.error(`[MT5 Bot] Error in bot loop:`, error);
        await this.logBotError(error);
      }
    }
  }

  /**
   * Check and execute trading signals
   */
  async checkAndExecuteSignals() {
    try {
      // Get latest analysis signals for active pairs
      const signals = await sql`
        SELECT a.*, fp.symbol
        FROM analysis a
        JOIN forex_pairs fp ON a.pair_id = fp.id
        WHERE a.overall_recommendation IN ('strong_buy', 'buy', 'strong_sell', 'sell')
        AND a.created_at > NOW() - INTERVAL '1 hour'
        ORDER BY a.confidence DESC
        LIMIT 10
      `;

      if (!signals || signals.length === 0) {
        return;
      }

      // Count current open trades
      const openTrades = await sql`
        SELECT COUNT(*) as count FROM mt5_orders
        WHERE account_id = ${this.accountId} AND status = 'open'
      `;

      const currentTradeCount = openTrades[0]?.count || 0;

      for (const signal of signals) {
        // Skip if max trades reached
        if (currentTradeCount >= this.maxConcurrentTrades) break;

        // Check if already trading this symbol
        const existingTrade = await sql`
          SELECT id FROM mt5_orders
          WHERE account_id = ${this.accountId} AND symbol = ${signal.symbol} AND status = 'open'
        `;

        if (existingTrade && existingTrade.length > 0) continue;

        // Validate trade parameters
        const analysisData = JSON.parse(signal.technical || '{}');
        const signalData = {
          symbol: signal.symbol,
          direction: signal.overall_recommendation.includes('buy') ? 'BUY' : 'SELL',
          entryPrice: analysisData.currentPrice || 0,
          stopLoss: analysisData.supportLevel || 0,
          takeProfit: analysisData.resistanceLevel || 0,
          confidence: signal.confidence,
        };

        try {
          // Execute trade
          await executeTradeFromSignal({
            accountId: this.accountId,
            userId: this.userId,
            signalData,
            riskPercentage: this.riskPercentage,
            maxLeverage: this.maxLeverage,
          });

          // Log trade execution
          await this.logTradeEvent('signal_executed', signal.symbol, signalData);
        } catch (error) {
          console.error(`[MT5 Bot] Failed to execute signal for ${signal.symbol}:`, error);
          await this.logTradeEvent('signal_failed', signal.symbol, { error: error.message });
        }
      }
    } catch (error) {
      console.error('[MT5 Bot] Error checking signals:', error);
      throw error;
    }
  }

  /**
   * Manage open positions (take profit, stop loss, trailing stops)
   */
  async manageOpenPositions() {
    try {
      const openTrades = await sql`
        SELECT mo.*, fp.symbol
        FROM mt5_orders mo
        LEFT JOIN forex_pairs fp ON mo.symbol = fp.symbol
        WHERE mo.account_id = ${this.accountId} AND mo.status = 'open'
      `;

      if (!openTrades || openTrades.length === 0) return;

      for (const trade of openTrades) {
        // Fetch current price for this symbol
        const currentPrice = await getCurrentPrice(trade.symbol);

        // Check if take profit or stop loss hit
        if (trade.take_profit && this.isTakeProfitHit(trade, currentPrice)) {
          await closeOrder({
            accountId: this.accountId,
            userId: this.userId,
            orderId: trade.id,
            comment: 'Take profit executed',
          });
          await this.logTradeEvent('take_profit_hit', trade.symbol, trade);
        } else if (trade.stop_loss && this.isStopLossHit(trade, currentPrice)) {
          await closeOrder({
            accountId: this.accountId,
            userId: this.userId,
            orderId: trade.id,
            comment: 'Stop loss executed',
          });
          await this.logTradeEvent('stop_loss_hit', trade.symbol, trade);
        }

        // Implement trailing stop if enabled (will fetch price internally)
        await this.applyTrailingStop(trade);
      }
    } catch (error) {
      console.error('[MT5 Bot] Error managing positions:', error);
      throw error;
    }
  }

  /**
   * Apply trailing stop logic
   */
  async applyTrailingStop(trade) {
    try {
      // Check if trailing stop is enabled for this account
      const botConfig = await sql`
        SELECT trailing_stop_enabled, trailing_stop_distance
        FROM mt5_bot_settings
        WHERE account_id = ${this.accountId}
      `;

      if (!botConfig || !botConfig[0]?.trailing_stop_enabled) return;

      const trailingDistance = botConfig[0].trailing_stop_distance || 50;

      // Get current price
      const currentPrice = await getCurrentPrice(trade.symbol);

      if (!currentPrice) return;

      if (trade.order_type === 'buy') {
        const newStopLoss = currentPrice - (trailingDistance / 10000);
        if (newStopLoss > trade.stop_loss) {
          await modifyOrder({
            accountId: this.accountId,
            userId: this.userId,
            orderId: trade.id,
            stopLoss: newStopLoss,
          });
        }
      } else if (trade.order_type === 'sell') {
        const newStopLoss = currentPrice + (trailingDistance / 10000);
        if (newStopLoss < trade.stop_loss) {
          await modifyOrder({
            accountId: this.accountId,
            userId: this.userId,
            orderId: trade.id,
            stopLoss: newStopLoss,
          });
        }
      }
    } catch (error) {
      console.error('[MT5 Bot] Error applying trailing stop:', error);
    }
  }

  /**
   * Check if take profit hit
   */
  isTakeProfitHit(trade, currentPrice) {
    if (trade.order_type === 'buy') {
      return currentPrice >= trade.take_profit;
    } else if (trade.order_type === 'sell') {
      return currentPrice <= trade.take_profit;
    }
    return false;
  }

  /**
   * Check if stop loss hit
   */
  isStopLossHit(trade, currentPrice) {
    if (trade.order_type === 'buy') {
      return currentPrice <= trade.stop_loss;
    } else if (trade.order_type === 'sell') {
      return currentPrice >= trade.stop_loss;
    }
    return false;
  }

  /**
   * Log trade event
   */
  async logTradeEvent(eventType, symbol, details) {
    try {
      await sql`
        INSERT INTO mt5_bot_events (account_id, user_id, event_type, symbol, details, created_at)
        VALUES (${this.accountId}, ${this.userId}, ${eventType}, ${symbol}, ${JSON.stringify(details)}, NOW())
      `;
    } catch (error) {
      console.error('[MT5 Bot] Error logging event:', error);
    }
  }

  /**
   * Log bot error
   */
  async logBotError(error) {
    try {
      await sql`
        INSERT INTO mt5_bot_errors (account_id, user_id, error_message, error_stack, created_at)
        VALUES (${this.accountId}, ${this.userId}, ${error.message}, ${error.stack}, NOW())
      `;
    } catch (e) {
      console.error('[MT5 Bot] Error logging error:', e);
    }
  }

  /**
   * Update bot last activity
   */
  async updateBotActivity() {
    try {
      await sql`
        UPDATE mt5_bot_status
        SET last_activity = NOW()
        WHERE account_id = ${this.accountId}
      `;
    } catch (error) {
      console.error('[MT5 Bot] Error updating activity:', error);
    }
  }

  /**
   * Get bot performance statistics
   */
  async getPerformanceStats() {
    try {
      const stats = await sql`
        SELECT
          COUNT(*) as total_trades,
          COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as winning_trades,
          COUNT(CASE WHEN profit_loss < 0 THEN 1 END) as losing_trades,
          SUM(profit_loss) as total_profit,
          AVG(profit_loss) as avg_profit,
          MAX(profit_loss) as max_win,
          MIN(profit_loss) as max_loss
        FROM mt5_orders
        WHERE account_id = ${this.accountId} AND status = 'closed'
      `;

      if (!stats || !stats[0]) {
        return null;
      }

      const data = stats[0];
      return {
        totalTrades: data.total_trades || 0,
        winningTrades: data.winning_trades || 0,
        losingTrades: data.losing_trades || 0,
        totalProfit: data.total_profit || 0,
        averageProfit: data.avg_profit || 0,
        bestTrade: data.max_win || 0,
        worstTrade: data.max_loss || 0,
        winRate: data.total_trades ? ((data.winning_trades / data.total_trades) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      console.error('[MT5 Bot] Error fetching performance stats:', error);
      throw error;
    }
  }
}

export default MT5TradingBot;
