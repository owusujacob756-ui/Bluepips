/**
 * MT5 Replica - Positions & Trade History
 * GET /api/mt5/replica/positions
 * POST /api/mt5/replica/positions/close
 */

import sql from '../../utils/sql.js';

export async function GET(request) {
  try {
    const userId = 1; // TODO: extract from session
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return Response.json(
        { success: false, error: 'accountId required' },
        { status: 400 }
      );
    }

    // Get open positions with current prices
    const result = await sql`
      SELECT p.*, f.current_price
      FROM mt5_replica_positions p
      LEFT JOIN forex_pairs f ON p.symbol = f.symbol
      WHERE p.account_id = ${accountId} AND p.status = 'open'
      ORDER BY p.opened_at DESC
    `;

    // Calculate unrealized PnL
    const positions = (result || []).map(pos => {
      const current = pos.current_price ? parseFloat(pos.current_price) : pos.entry_price;
      const pnl = pos.type === 'buy'
        ? (current - pos.entry_price) * pos.volume
        : (pos.entry_price - current) * pos.volume;

      return {
        ...pos,
        currentPrice: current,
        unrealizedPnL: parseFloat(pnl.toFixed(2)),
        unrealizedPercent: ((pnl / (pos.entry_price * pos.volume)) * 100).toFixed(2),
      };
    });

    return Response.json({
      success: true,
      positions,
    });
  } catch (error) {
    console.error('[MT5 Replica] Error fetching positions:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = 1; // TODO: extract from session
    const { positionId, closePrice } = await request.json();

    if (!positionId) {
      return Response.json(
        { success: false, error: 'positionId required' },
        { status: 400 }
      );
    }

    // Get position
    const posResult = await sql`
      SELECT * FROM mt5_replica_positions
      WHERE id = ${positionId} AND user_id = ${userId}
    `;

    if (!posResult || !posResult[0]) {
      return Response.json(
        { success: false, error: 'Position not found' },
        { status: 404 }
      );
    }

    const position = posResult[0];

    // Get close price if not provided
    let finalClosePrice = closePrice;
    if (!finalClosePrice) {
      const priceResult = await sql`
        SELECT current_price FROM forex_pairs WHERE symbol = ${position.symbol}
      `;
      if (priceResult && priceResult[0]) {
        finalClosePrice = parseFloat(priceResult[0].current_price);
      }
    }

    // Calculate PnL
    const pnl = position.type === 'buy'
      ? (finalClosePrice - position.entry_price) * position.volume
      : (position.entry_price - finalClosePrice) * position.volume;

    const pnlPercent = (pnl / (position.entry_price * position.volume)) * 100;

    // Update position to closed
    await sql`
      UPDATE mt5_replica_positions
      SET status = 'closed', close_price = ${finalClosePrice}, closed_at = NOW()
      WHERE id = ${positionId}
    `;

    // Create trade history entry
    await sql`
      INSERT INTO mt5_replica_trades (
        account_id, user_id, symbol, type, volume,
        entry_price, exit_price, pnl, pnl_percent,
        duration_seconds, opened_at, closed_at
      )
      SELECT
        account_id, user_id, symbol, type, volume,
        entry_price, ${finalClosePrice}, ${pnl}, ${pnlPercent},
        EXTRACT(EPOCH FROM (NOW() - opened_at))::integer,
        opened_at, NOW()
      FROM mt5_replica_positions
      WHERE id = ${positionId}
    `;

    // Update account balance
    await sql`
      UPDATE mt5_replica_accounts
      SET current_balance = current_balance + ${pnl}
      WHERE id = ${position.account_id}
    `;

    return Response.json({
      success: true,
      trade: {
        positionId,
        exitPrice: finalClosePrice,
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPercent: parseFloat(pnlPercent.toFixed(2)),
        closedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[MT5 Replica] Error closing position:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
