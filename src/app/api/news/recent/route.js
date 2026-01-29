import sql from '../../utils/sql';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair');

    if (pair) {
      const pairRow = await sql`SELECT id FROM forex_pairs WHERE symbol = ${pair}`;
      if (!pairRow || !pairRow[0]) return Response.json({ error: 'Pair not found' }, { status: 404 });
      const pairId = pairRow[0].id;
      const items = await sql`SELECT * FROM news_items WHERE pair_id = ${pairId} ORDER BY published_at DESC LIMIT 10`;
      return Response.json({ news: items || [] });
    }

    const items = await sql`SELECT ni.*, fp.symbol FROM news_items ni JOIN forex_pairs fp ON ni.pair_id = fp.id ORDER BY published_at DESC LIMIT 20`;
    return Response.json({ news: items || [] });
  } catch (error) {
    console.error('Error fetching news items:', error);
    return Response.json({ error: 'Failed to fetch news items' }, { status: 500 });
  }
}