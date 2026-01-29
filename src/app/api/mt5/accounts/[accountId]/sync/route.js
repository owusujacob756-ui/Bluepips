import { syncOpenOrders } from '../../../../../lib/mt5.js';

export async function POST(request, { params }) {
  try {
    const { accountId } = params;
    const userId = 1; // From auth context

    const result = await syncOpenOrders(accountId, userId);
    
    return Response.json({ result }, { status: 200 });
  } catch (error) {
    console.error('MT5 Sync Orders Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
