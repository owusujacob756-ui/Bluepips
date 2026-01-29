import sql from '../../utils/sql';

export async function GET(request) {
  try {
    // Return latest analysis per pair
    const rows = await sql`
      SELECT DISTINCT ON (a.pair_id) a.id, a.pair_id, a.timeframe, a.overall_recommendation, a.confidence, a.details, fp.symbol, fp.name, a.created_at
      FROM analysis a
      JOIN forex_pairs fp ON a.pair_id = fp.id
      ORDER BY a.pair_id, a.created_at DESC
    `;

    return Response.json({ analyses: rows || [] });
  } catch (error) {
    console.error('Error fetching latest analyses:', error);
    return Response.json({ error: 'Failed to fetch latest analyses' }, { status: 500 });
  }
}