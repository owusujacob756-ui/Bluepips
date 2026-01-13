import sql from '../utils/sql';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get('pairId') || '1';
    const timeframe = searchParams.get('timeframe') || '1H';
    const limit = searchParams.get('limit') || '100';

    const priceHistory = await sql`
      SELECT 
        open_price,
        high_price,
        low_price,
        close_price,
        volume,
        timestamp
      FROM price_history
      WHERE pair_id = ${pairId}
        AND timeframe = ${timeframe}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    // Reverse to get chronological order
    const chronological = priceHistory.reverse();

    return Response.json({ priceHistory: chronological });
  } catch (error) {
    console.error('Error fetching price history:', error);
    return Response.json({ error: 'Failed to fetch price history' }, { status: 500 });
  }
}
