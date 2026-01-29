import {
  getMT5Account,
  getAccountInfo,
  syncOpenOrders,
} from '../../../../lib/mt5.js';

export async function GET(request, { params }) {
  try {
    const { accountId } = params;
    const userId = 1; // From auth context

    const accountInfo = await getAccountInfo(accountId, userId);
    
    return Response.json({ account: accountInfo }, { status: 200 });
  } catch (error) {
    console.error('MT5 Account Info Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
