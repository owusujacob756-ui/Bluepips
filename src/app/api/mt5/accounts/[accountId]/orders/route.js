import {
  placeMarketOrder,
  placePendingOrder,
  modifyOrder,
  closeOrder,
  getOrderHistory,
} from '../../../../lib/mt5.js';

export async function GET(request, { params }) {
  try {
    const { accountId } = params;
    const userId = 1; // From auth context
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit') || 100;
    const offset = url.searchParams.get('offset') || 0;

    const orders = await getOrderHistory({
      accountId,
      userId,
      symbol,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return Response.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('MT5 Order History Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { accountId } = params;
    const userId = 1; // From auth context
    const body = await request.json();
    const { orderType, symbol, volume, openPrice, stopLoss, takeProfit, comment } = body;

    if (!orderType || !symbol || !volume) {
      return Response.json(
        { error: 'orderType, symbol, and volume required' },
        { status: 400 }
      );
    }

    let order;

    if (orderType.toLowerCase() === 'buy' || orderType.toLowerCase() === 'sell') {
      // Market Order
      order = await placeMarketOrder({
        accountId,
        userId,
        symbol,
        orderType,
        volume,
        stopLoss,
        takeProfit,
        comment: comment || '',
      });
    } else {
      // Pending Order
      if (!openPrice) {
        return Response.json(
          { error: 'openPrice required for pending orders' },
          { status: 400 }
        );
      }

      order = await placePendingOrder({
        accountId,
        userId,
        symbol,
        orderType,
        volume,
        openPrice,
        stopLoss,
        takeProfit,
        comment: comment || '',
      });
    }

    return Response.json({ order }, { status: 201 });
  } catch (error) {
    console.error('MT5 Place Order Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
