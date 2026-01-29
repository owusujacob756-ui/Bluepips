import MT5TradingBot from '../../../../../lib/mt5-trading-bot.js';
import sql from '../../../utils/sql.js';

export async function GET(request, { params }) {
  try {
    const { accountId } = params;
    const userId = 1; // From auth context

    const bot = new MT5TradingBot(accountId, userId);
    const stats = await bot.getPerformanceStats();

    // Get recent events
    const events = await sql`
      SELECT * FROM mt5_bot_events
      WHERE account_id = ${accountId} AND user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return Response.json(
      { stats, recentEvents: events || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('MT5 Bot Stats Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
