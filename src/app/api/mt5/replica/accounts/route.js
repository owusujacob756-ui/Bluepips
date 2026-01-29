/**
 * MT5 Replica - Account Management API
 * GET /api/mt5/replica/accounts
 * POST /api/mt5/replica/accounts
 */

import sql from '../../utils/sql.js';

export async function GET(request) {
  try {
    // Get user ID from session (implement auth as needed)
    const userId = 1; // TODO: extract from session
    
    const result = await sql`
      SELECT * FROM mt5_replica_accounts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return Response.json({
      success: true,
      accounts: result || [],
    });
  } catch (error) {
    console.error('[MT5 Replica] Error fetching accounts:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = 1; // TODO: extract from session
    const { accountName, initialBalance = 10000, leverage = 100 } = await request.json();

    // Validate inputs
    if (!accountName || initialBalance <= 0 || leverage <= 0) {
      return Response.json(
        { success: false, error: 'Invalid account parameters' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO mt5_replica_accounts (
        user_id, account_name, initial_balance, current_balance, leverage
      )
      VALUES (${userId}, ${accountName}, ${initialBalance}, ${initialBalance}, ${leverage})
      RETURNING *
    `;

    return Response.json({
      success: true,
      account: result[0],
    });
  } catch (error) {
    console.error('[MT5 Replica] Error creating account:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
