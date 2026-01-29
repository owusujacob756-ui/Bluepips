import sql from '../utils/sql';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const userId = 1; // Demo user

    let rows;
    if (status) {
      rows = await sql`SELECT * FROM trades WHERE user_id = ${userId} AND status = ${status} ORDER BY opened_at DESC`;
    } else {
      rows = await sql`SELECT * FROM trades WHERE user_id = ${userId} ORDER BY opened_at DESC`;
    }

    return Response.json({ trades: rows || [] });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return Response.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const userId = 1; // Demo user

    const { pairSymbol, tradeType, entryPrice, positionSize, stopLoss, takeProfit, executionMode } = body;
    if (!pairSymbol || !tradeType || !entryPrice || !positionSize) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pairRow = await sql`SELECT id FROM forex_pairs WHERE symbol = ${pairSymbol}`;
    if (!pairRow || !pairRow[0]) return Response.json({ error: 'Pair not found' }, { status: 404 });
    const pairId = pairRow[0].id;

    const insert = await sql`
      INSERT INTO trades (user_id, pair_id, trade_type, entry_price, position_size, stop_loss, take_profit, status, execution_mode, opened_at)
      VALUES (${userId}, ${pairId}, ${tradeType}, ${entryPrice}, ${positionSize}, ${stopLoss || null}, ${takeProfit || null}, 'open', ${executionMode || 'demo'}, NOW())
      RETURNING id
    `;

    return Response.json({ id: insert && insert[0] ? insert[0].id : null });
  } catch (error) {
    console.error('Error creating trade:', error);
    return Response.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { tradeId, exitPrice, status } = body;
    if (!tradeId) return Response.json({ error: 'tradeId required' }, { status: 400 });

    const updates = [];
    if (exitPrice !== undefined) updates.push(sql`exit_price = ${exitPrice}`);
    if (status) updates.push(sql`status = ${status}`);

    // For simplicity update using a single SQL statement
    await sql`
      UPDATE trades
      SET
        exit_price = COALESCE(${exitPrice}, exit_price),
        status = COALESCE(${status}, status),
        closed_at = CASE WHEN ${status} = 'closed' THEN NOW() ELSE closed_at END
      WHERE id = ${tradeId}
    `;

    const updated = await sql`SELECT * FROM trades WHERE id = ${tradeId}`;
    return Response.json({ trade: updated && updated[0] ? updated[0] : null });
  } catch (error) {
    console.error('Error updating trade:', error);
    return Response.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}
