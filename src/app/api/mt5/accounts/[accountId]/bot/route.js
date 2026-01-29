import MT5TradingBot from '../../../../lib/mt5-trading-bot.js';
import sql from '../../utils/sql.js';

// Map to store active bot instances
const activeBots = new Map();

export async function GET(request, { params }) {
  try {
    const { accountId } = params;
    const userId = 1; // From auth context

    const botStatus = await sql`
      SELECT * FROM mt5_bot_status
      WHERE account_id = ${accountId} AND user_id = ${userId}
    `;

    return Response.json(
      { bot: botStatus && botStatus[0] ? botStatus[0] : null },
      { status: 200 }
    );
  } catch (error) {
    console.error('MT5 Bot Status Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { accountId } = params;
    const userId = 1; // From auth context
    const body = await request.json();
    const { action, config } = body;

    if (!action) {
      return Response.json({ error: 'action required' }, { status: 400 });
    }

    const botKey = `${accountId}-${userId}`;

    if (action === 'start') {
      if (!activeBots.has(botKey)) {
        const bot = new MT5TradingBot(accountId, userId);
        activeBots.set(botKey, bot);
        await bot.start();
      }

      return Response.json(
        { message: 'Bot started', status: 'running' },
        { status: 200 }
      );
    } else if (action === 'stop') {
      if (activeBots.has(botKey)) {
        const bot = activeBots.get(botKey);
        await bot.stop();
        activeBots.delete(botKey);
      }

      return Response.json(
        { message: 'Bot stopped', status: 'stopped' },
        { status: 200 }
      );
    } else if (action === 'updateConfig' && config) {
      // Save bot configuration
      await sql`
        INSERT INTO mt5_bot_settings (
          account_id, user_id, trailing_stop_enabled,
          trailing_stop_distance, max_concurrent_trades, risk_percentage
        )
        VALUES (
          ${accountId}, ${userId}, ${config.trailingStopEnabled || false},
          ${config.trailingStopDistance || 50}, ${config.maxConcurrentTrades || 5},
          ${config.riskPercentage || 2}
        )
        ON CONFLICT (account_id) DO UPDATE SET
          trailing_stop_enabled = ${config.trailingStopEnabled || false},
          trailing_stop_distance = ${config.trailingStopDistance || 50},
          max_concurrent_trades = ${config.maxConcurrentTrades || 5},
          risk_percentage = ${config.riskPercentage || 2}
      `;

      return Response.json({ message: 'Config updated' }, { status: 200 });
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('MT5 Bot Control Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
