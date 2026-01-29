/**
 * MT5 Replica - Order Management
 * POST /api/mt5/replica/orders
 * GET /api/mt5/replica/orders
 */

import sql from '../../utils/sql.js';

export async function GET(request) {
  try {
    const userId = 1; // TODO: extract from session
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!accountId) {
      return Response.json(
        { success: false, error: 'accountId required' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT * FROM mt5_replica_orders
      WHERE account_id = ${accountId} AND user_id = ${userId}
      ORDER BY opened_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return Response.json({
      success: true,
      orders: result || [],
    });
  } catch (error) {
    console.error('[MT5 Replica] Error fetching orders:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = 1; // TODO: extract from session
    const {
      accountId,
      symbol,
      orderType,
      volume,
      openPrice,
      stopLoss,
      takeProfit,
      comment,
      expiration,
    } = await request.json();

    // Validate
    if (!accountId || !symbol || !orderType || !volume) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current price if market order
    let entryPrice = openPrice;
    if (['buy', 'sell'].includes(orderType)) {
      const priceResult = await sql`
        SELECT current_price FROM forex_pairs WHERE symbol = ${symbol}
      `;
      if (priceResult && priceResult[0]) {
        entryPrice = parseFloat(priceResult[0].current_price);
      }
    }

    // Insert order
    const result = await sql`
      INSERT INTO mt5_replica_orders (
        account_id, user_id, symbol, order_type, volume,
        entry_price, stop_loss, take_profit, comment, expiration, status
      )
      VALUES (
        ${accountId}, ${userId}, ${symbol}, ${orderType}, ${volume},
        ${entryPrice}, ${stopLoss}, ${takeProfit}, ${comment}, ${expiration},
        ${['buy', 'sell'].includes(orderType) ? 'open' : 'pending'}
      )
      RETURNING *
    `;

    // If market order, create position immediately
    if (['buy', 'sell'].includes(orderType)) {
      await sql`
        INSERT INTO mt5_replica_positions (
          account_id, user_id, symbol, type, volume,
          entry_price, stop_loss, take_profit, current_price
        )
        VALUES (
          ${accountId}, ${userId}, ${symbol}, ${orderType}, ${volume},
          ${entryPrice}, ${stopLoss}, ${takeProfit}, ${entryPrice}
        )
      `;
    }

    return Response.json({
      success: true,
      order: result[0],
    });
  } catch (error) {
    console.error('[MT5 Replica] Error placing order:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
