import sql from '../../utils/sql';
import { fetchNewsForPair } from '../../../../lib/newsProvider';
import { analyzeFundamental } from '../../../../lib/aiProvider';
import { createAnalysis, saveNewsItems } from '../../../../lib/analysis';

export async function POST(request) {
  try {
    const body = await request.json();
    const pairSymbol = body.pair || body.symbol;

    if (!pairSymbol) return Response.json({ error: 'pair is required' }, { status: 400 });

    // Get pair id
    const pairRows = await sql`SELECT id, symbol FROM forex_pairs WHERE symbol = ${pairSymbol}`;
    if (!pairRows || !pairRows[0]) return Response.json({ error: 'pair not found' }, { status: 404 });
    const pairId = pairRows[0].id;

    // Fetch news (stubbed if no NEWS_API_KEY)
    const articles = await fetchNewsForPair(pairSymbol);

    // Save news items for auditing and re-use
    await saveNewsItems(pairId, articles);

    // Call AI fundamental analysis
    const aiResult = await analyzeFundamental({ pair: pairSymbol, newsItems: articles });

    // Persist result in unified analysis table
    const analysisId = await createAnalysis({
      pairId,
      timeframe: null,
      technical: null,
      fundamental: { news: articles, sentiment: aiResult.sentiment || 'neutral', impact: aiResult.impact || 'medium', summary: aiResult.summary || aiResult },
      overall: null,
      confidence: aiResult.confidence || 50.0,
      details: { ai: aiResult }
    });

    return Response.json({ id: analysisId, result: aiResult });
  } catch (error) {
    console.error('Error in fundamental analysis route:', error);
    return Response.json({ error: 'Failed to run fundamental analysis' }, { status: 500 });
  }
}
