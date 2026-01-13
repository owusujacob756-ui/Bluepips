import sql from '../../../utils/sql';

export async function GET(request) {
  try {
    const pairs = await sql`
      SELECT * FROM forex_pairs 
      WHERE is_active = true 
      ORDER BY symbol
    `;
    
    return Response.json({ pairs });
  } catch (error) {
    console.error('Error fetching forex pairs:', error);
    return Response.json({ error: 'Failed to fetch forex pairs' }, { status: 500 });
  }
}
