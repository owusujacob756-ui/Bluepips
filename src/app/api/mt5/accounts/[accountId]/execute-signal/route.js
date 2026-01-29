import { executeTradeFromSignal } from '../../../../../lib/mt5.js';

export async function POST(request, { params }) {
  try {
    const { accountId } = params;
    const userId = 1; // From auth context
    const body = await request.json();
    const {
      signalData,
      riskPercentage = 2,
      maxLeverage = 10,
    } = body;

    if (!signalData) {
      return Response.json(
        { error: 'signalData required' },
        { status: 400 }
      );
    }

    const order = await executeTradeFromSignal({
      accountId,
      userId,
      signalData,
      riskPercentage,
      maxLeverage,
    });

    return Response.json({ order }, { status: 201 });
  } catch (error) {
    console.error('MT5 Execute Signal Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
