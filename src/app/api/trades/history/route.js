import sql from '../../../utils/sql';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'open', 'closed', or null for all
    const userId = 1; // Demo user

    let query;
    if (status) {
      query = sql`
        SELECT 
          t.*,
          fp.symbol,
          fp.name as pair_name,
          s.pattern_detected,
          s.confidence as signal_confidence
        FROM trades t
        JOIN forex_pairs fp ON t.pair_id = fp.id
        LEFT JOIN signals s ON t.signal_id = s.id
        WHERE t.user_id = ${userId}
          AND t.status = ${status}
        ORDER BY t.opened_at DESC
      `;
    } else {
      query = sql`
        SELECT 
          t.*,
          fp.symbol,
          fp.name as pair_name,
          s.pattern_detected,
          s.confidence as signal_confidence
        FROM trades t
        JOIN forex_pairs fp ON t.pair_id = fp.id
        LEFT JOIN signals s ON t.signal_id = s.id
        WHERE t.user_id = ${userId}
        ORDER BY t.opened_at DESC
      `;
    }

    const trades = await query;
    
    // Calculate summary stats
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalPL = closedTrades.reduce((sum, t) => sum + parseFloat(t.profit_loss || 0), 0);
    const winningTrades = closedTrades.filter(t => parseFloat(t.profit_loss) > 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const bestTrade = closedTrades.length > 0 
      ? Math.max(...closedTrades.map(t => parseFloat(t.profit_loss || 0)))
      : 0;
    const avgPL = closedTrades.length > 0 ? totalPL / closedTrades.length : 0;

    return Response.json({ 
      trades,
      summary: {
        totalPL,
        winRate,
        bestTrade,
        avgPL,
        totalTrades: trades.length,
        openTrades: trades.filter(t => t.status === 'open').length
      }
    });
  } catch (error) {
    console.error('Error fetching trade history:', error);
    return Response.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}
