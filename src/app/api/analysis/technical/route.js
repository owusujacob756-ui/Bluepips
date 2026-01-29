import sql from '../../utils/sql';
import { analyzeTechnical } from '../../../../lib/aiProvider';
import { createAnalysis } from '../../../../lib/analysis';

export async function POST(request) {
  try {
    const body = await request.json();
    const pairSymbol = body.pair || body.symbol;
    const timeframe = body.timeframe || '1H';

    if (!pairSymbol) return Response.json({ error: 'pair is required' }, { status: 400 });

    // Get pair id and basic info
    const pairRows = await sql`SELECT id, symbol FROM forex_pairs WHERE symbol = ${pairSymbol}`;
    if (!pairRows || !pairRows[0]) return Response.json({ error: 'pair not found' }, { status: 404 });
    const pairId = pairRows[0].id;

    // Fetch recent price history for the pair and timeframe
    const priceHistory = await sql`
      SELECT timestamp, open_price as open, high_price as high, low_price as low, close_price as close
      FROM price_history
      WHERE pair_id = ${pairId} AND timeframe = ${timeframe}
      ORDER BY timestamp ASC
      LIMIT 500
    `;

    // Call AI analysis (stubbed if OPENAI_API_KEY missing)
    const aiResult = await analyzeTechnical({ pair: pairSymbol, timeframe, priceHistory });

    // Persist result in unified analysis table
    const analysisId = await createAnalysis({
      pairId,
      timeframe,
      technical: aiResult.indicators || null,
      overall: aiResult.recommendation || 'hold',
      confidence: aiResult.confidence || 50.0,
      details: { ai: aiResult }
    });

    return Response.json({ id: analysisId, result: aiResult });
  } catch (error) {
    console.error('Error in technical analysis route:', error);
    return Response.json({ error: 'Failed to run technical analysis', message: error.message, stack: error.stack }, { status: 500 });
  }
}