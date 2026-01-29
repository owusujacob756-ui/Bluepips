import sql from '../../utils/sql';

export async function GET(request) {
  try {
    const userId = 1; // Demo user

    // Get overall stats
    const trades = await sql`
      SELECT 
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE status = 'closed' AND profit_loss > 0) as winning_trades,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_trades,
        SUM(COALESCE(profit_loss, 0)) as total_pl
      FROM trades
      WHERE user_id = ${userId}
    `;

    // Defensive defaults when the DB is unavailable or returns no rows
    const stats = trades && trades[0] ? trades[0] : {
      total_trades: 0,
      winning_trades: 0,
      closed_trades: 0,
      total_pl: 0
    };

    const winRate = stats.closed_trades > 0 
      ? (stats.winning_trades / stats.closed_trades) * 100 
      : 0;

    // Get active signals count (defensive default if DB is unavailable)
    const activeSignals = await sql`
      SELECT COUNT(*) as count FROM signals WHERE status = 'active'
    `;

    const activeCount = activeSignals && activeSignals[0] ? parseInt(activeSignals[0].count) : 0;

    return Response.json({
      totalPL: parseFloat(stats.total_pl || 0),
      winRate: parseFloat(winRate.toFixed(2)),
      totalTrades: parseInt(stats.total_trades),
      activeSignals: activeCount
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
