import {
  registerMT5Account,
  getUserMT5Accounts,
  getMT5Account,
  getAccountInfo,
  syncOpenOrders,
} from '../../../lib/mt5.js';

export async function GET(request) {
  try {
    const userId = 1; // From auth context
    const accounts = await getUserMT5Accounts(userId);
    
    return Response.json({ accounts }, { status: 200 });
  } catch (error) {
    console.error('MT5 Accounts Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = 1; // From auth context
    const body = await request.json();
    const {
      accountLogin,
      accountPassword,
      brokerName = 'ICMarkets',
      accountType = 'live',
      accountBalance = 0,
    } = body;

    if (!accountLogin || !accountPassword) {
      return Response.json(
        { error: 'accountLogin and accountPassword required' },
        { status: 400 }
      );
    }

    const account = await registerMT5Account({
      userId,
      accountLogin,
      accountPassword,
      brokerName,
      accountType,
      accountBalance,
    });

    return Response.json({ account }, { status: 201 });
  } catch (error) {
    console.error('MT5 Account Registration Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
