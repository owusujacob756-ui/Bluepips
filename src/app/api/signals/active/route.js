import sql from '../../../utils/sql';

export async function GET(request) {
  try {
    const signals = await sql`
      SELECT 
        s.*,
        fp.symbol,
        fp.name as pair_name,
        fp.current_price
      FROM signals s
      JOIN forex_pairs fp ON s.pair_id = fp.id
      WHERE s.status = 'active'
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
      ORDER BY s.created_at DESC
      LIMIT 10
    `;
    
    return Response.json({ signals });
  } catch (error) {
    console.error('Error fetching active signals:', error);
    return Response.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}
