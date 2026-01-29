/**
 * MT5 Replica - Trade History & Statistics
 * GET /api/mt5/replica/history
 * GET /api/mt5/replica/stats
 */

import sql from '../../utils/sql.js';

export async function GET(request) {
  try {
    const userId = 1; // TODO: extract from session
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const type = searchParams.get('type') || 'history'; // 'history' or 'stats'
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!accountId) {
      return Response.json(
        { success: false, error: 'accountId required' },
        { status: 400 }
      );
    }

    // Trade history
    if (type === 'history') {
      const result = await sql`
        SELECT * FROM mt5_replica_trades
        WHERE account_id = ${accountId} AND user_id = ${userId}
        ORDER BY closed_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return Response.json({
        success: true,
        trades: result || [],
      });
    }

    // Statistics
    if (type === 'stats') {
      const stats = await sql`
        SELECT
          COUNT(*) as total_trades,
          COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades,
          COUNT(CASE WHEN pnl < 0 THEN 1 END) as losing_trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) as avg_pnl,
          MAX(pnl) as max_win,
          MIN(pnl) as max_loss,
          AVG(duration_seconds) as avg_duration
        FROM mt5_replica_trades
        WHERE account_id = ${accountId} AND user_id = ${userId}
      `;

      if (!stats || !stats[0]) {
        return Response.json({
          success: true,
          stats: {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalPnL: 0,
            avgPnL: 0,
            winRate: 0,
            bestTrade: 0,
            worstTrade: 0,
            avgDuration: 0,
          },
        });
      }

      const data = stats[0];
      const totalTrades = parseInt(data.total_trades) || 0;
      const winningTrades = parseInt(data.winning_trades) || 0;

      return Response.json({
        success: true,
        stats: {
          totalTrades,
          winningTrades,
          losingTrades: parseInt(data.losing_trades) || 0,
          totalPnL: parseFloat(data.total_pnl) || 0,
          avgPnL: parseFloat(data.avg_pnl) || 0,
          winRate: totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : 0,
          bestTrade: parseFloat(data.max_win) || 0,
          worstTrade: parseFloat(data.max_loss) || 0,
          avgDuration: parseInt(data.avg_duration) || 0,
        },
      });
    }

    return Response.json(
      { success: false, error: 'Invalid type parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[MT5 Replica] Error fetching history/stats:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
