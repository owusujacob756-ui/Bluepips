/**
 * MT5 Replica - Market Data & Price Feed
 * GET /api/mt5/replica/prices
 */

import sql from '../../utils/sql.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',') || [
      'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'XAUUSD'
    ];

    // Get current prices from forex_pairs
    const result = await sql`
      SELECT symbol, current_price, price_change_24h, price_change_percent
      FROM forex_pairs
      WHERE symbol = ANY(${symbols})
    `;

    if (!result) {
      return Response.json({ success: true, prices: {} });
    }

    const prices = {};
    for (const row of result) {
      prices[row.symbol] = {
        bid: parseFloat(row.current_price) - 0.0001,
        ask: parseFloat(row.current_price) + 0.0001,
        current: parseFloat(row.current_price),
        change24h: parseFloat(row.price_change_24h),
        changePercent: parseFloat(row.price_change_percent),
      };
    }

    return Response.json({
      success: true,
      prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MT5 Replica] Error fetching prices:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
