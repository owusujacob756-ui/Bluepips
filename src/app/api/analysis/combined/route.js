import sql from '../../utils/sql';
import { analyzeTechnical } from '../../../../lib/aiProvider';
import { analyzeFundamental } from '../../../../lib/aiProvider';
import { fetchNewsForPair } from '../../../../lib/newsProvider';
import { createAnalysis, saveNewsItems } from '../../../../lib/analysis';

export async function POST(request) {
  try {
    const body = await request.json();
    const pairSymbol = body.pair || body.symbol;
    const timeframe = body.timeframe || '1H';

    if (!pairSymbol) return Response.json({ error: 'pair is required' }, { status: 400 });

    const pairRows = await sql`SELECT id FROM forex_pairs WHERE symbol = ${pairSymbol}`;
    if (!pairRows || !pairRows[0]) return Response.json({ error: 'pair not found' }, { status: 404 });
    const pairId = pairRows[0].id;

    // Technical
    const priceHistory = await sql`
      SELECT timestamp, open_price as open, high_price as high, low_price as low, close_price as close
      FROM price_history
      WHERE pair_id = ${pairId} AND timeframe = ${timeframe}
      ORDER BY timestamp ASC
      LIMIT 500
    `;
    const tech = await analyzeTechnical({ pair: pairSymbol, timeframe, priceHistory });

    // Save news items
    const news = await fetchNewsForPair(pairSymbol);
    await saveNewsItems(pairId, news);

    // Combine simple rule-based merge
    let overall = 'hold';
    let confidence = 50.0;

    const techRec = (tech && tech.recommendation) ? tech.recommendation.toLowerCase() : 'hold';
    const fundSent = (fund && fund.sentiment) ? (fund.sentiment === 'bullish' ? 'buy' : fund.sentiment === 'bearish' ? 'sell' : 'hold') : 'hold';

    if (techRec === fundSent && techRec !== 'hold') {
      overall = techRec;
      confidence = Math.min(100, ((tech.confidence || 50) + (fund.confidence || 50)) / 2);
    } else {
      // Pick the side with higher confidence
      const techConf = tech.confidence || 50;
      const fundConf = fund.confidence || 50;
      if (techRec !== 'hold' && techConf > fundConf) {
        overall = techRec;
        confidence = techConf;
      } else if (fundSent !== 'hold' && fundConf > techConf) {
        overall = fundSent;
        confidence = fundConf;
      } else {
        overall = 'hold';
        confidence = Math.max(techConf, fundConf);
      }
    }

    // Persist merged result to unified analysis table
    const analysisId = await createAnalysis({
      pairId,
      timeframe,
      technical: tech,
      fundamental: fund,
      overall,
      confidence,
      details: { tech, fund }
    });

    return Response.json({ id: analysisId, overall, confidence, tech, fund });
  } catch (error) {
    console.error('Error in combined analysis route:', error);
    return Response.json({ error: 'Failed to run combined analysis' }, { status: 500 });
  }
}