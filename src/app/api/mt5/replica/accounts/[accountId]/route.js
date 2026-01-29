/**
 * MT5 Replica - Get Single Account Detail
 * GET /api/mt5/replica/accounts/[accountId]
 */

import sql from '../../../utils/sql.js';

export async function GET(request, { params }) {
  try {
    const userId = 1; // TODO: extract from session
    const { accountId } = params;

    // Get account
    const result = await sql`
      SELECT * FROM mt5_replica_accounts
      WHERE id = ${accountId} AND user_id = ${userId}
    `;

    if (!result || !result[0]) {
      return Response.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    const account = result[0];

    // Get open positions
    const positions = await sql`
      SELECT * FROM mt5_replica_positions
      WHERE account_id = ${accountId} AND status = 'open'
      ORDER BY opened_at DESC
    `;

    // Calculate equity and margin
    let equity = account.current_balance;
    let margin = 0;

    if (positions && positions.length > 0) {
      for (const pos of positions) {
        const pnl = pos.type === 'buy'
          ? (pos.current_price - pos.entry_price) * pos.volume
          : (pos.entry_price - pos.current_price) * pos.volume;
        
        equity += pnl;
        margin += (pos.entry_price * pos.volume) / account.leverage;
      }
    }

    const freeMargin = equity - margin;

    return Response.json({
      success: true,
      account: {
        ...account,
        equity: parseFloat(equity.toFixed(2)),
        margin: parseFloat(margin.toFixed(2)),
        freeMargin: parseFloat(freeMargin.toFixed(2)),
        marginLevel: margin > 0 ? (equity / margin * 100).toFixed(2) : 0,
        openPositions: positions ? positions.length : 0,
      },
    });
  } catch (error) {
    console.error('[MT5 Replica] Error fetching account:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
