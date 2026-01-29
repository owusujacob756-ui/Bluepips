import { placeOrder } from '../../../../lib/execution.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pair, side, size, price } = body;
    if (!pair || !size) return Response.json({ error: 'pair and size required' }, { status: 400 });
    const exec = await placeOrder({ pair, side, size, price });
    return Response.json({ execution: exec }, { status: 200 });
  } catch (err) {
    console.error('Execute order failed:', err);
    return Response.json({ error: 'Execution failed', message: err.message }, { status: 500 });
  }
}