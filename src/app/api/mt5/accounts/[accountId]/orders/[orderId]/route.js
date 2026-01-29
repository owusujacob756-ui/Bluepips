import {
  modifyOrder,
  closeOrder,
} from '../../../../../lib/mt5.js';

export async function PUT(request, { params }) {
  try {
    const { accountId, orderId } = params;
    const userId = 1; // From auth context
    const body = await request.json();
    const { stopLoss, takeProfit, openPrice } = body;

    const result = await modifyOrder({
      accountId,
      userId,
      orderId,
      stopLoss,
      takeProfit,
      openPrice,
    });

    return Response.json({ result }, { status: 200 });
  } catch (error) {
    console.error('MT5 Modify Order Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { accountId, orderId } = params;
    const userId = 1; // From auth context
    const body = await request.json();
    const { closePrice, comment } = body;

    const result = await closeOrder({
      accountId,
      userId,
      orderId,
      closePrice,
      comment: comment || '',
    });

    return Response.json({ result }, { status: 200 });
  } catch (error) {
    console.error('MT5 Close Order Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
