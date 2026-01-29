import sql from '../app/api/utils/sql';

export async function getForexPairs() {
  return await sql`SELECT * FROM forex_pairs ORDER BY symbol`;
}

export async function getPairBySymbol(symbol) {
  const rows = await sql`SELECT * FROM forex_pairs WHERE symbol = ${symbol}`;
  return rows && rows[0] ? rows[0] : null;
}

export async function saveAnalysisRow({ pairId, timeframe = null, technical = null, fundamental = null, overall = null, confidence = null, details = null }) {
  const insert = await sql`
    INSERT INTO analysis (pair_id, timeframe, technical, fundamental, overall_recommendation, confidence, details)
    VALUES (${pairId}, ${timeframe}, ${technical ? JSON.stringify(technical) : null}, ${fundamental ? JSON.stringify(fundamental) : null}, ${overall}, ${confidence}, ${details ? JSON.stringify(details) : null})
    RETURNING id
  `;
  return insert && insert[0] ? insert[0].id : null;
}

export async function getLatestAnalyses(limit = 50) {
  return await sql`
    SELECT DISTINCT ON (a.pair_id) a.id, a.pair_id, a.timeframe, a.overall_recommendation, a.confidence, a.details, fp.symbol, fp.name, a.created_at
    FROM analysis a
    JOIN forex_pairs fp ON a.pair_id = fp.id
    ORDER BY a.pair_id, a.created_at DESC
    LIMIT ${limit}
  `;
}

export async function saveNewsItems(pairId, articles = []) {
  if (!articles || articles.length === 0) return;
  return sql.transaction(async (tx) => {
    const ops = [];
    for (const a of articles) {
      ops.push(tx`
        INSERT INTO news_items (pair_id, source, title, description, url, published_at, fetched_at)
        VALUES (${pairId}, ${a.source || null}, ${a.title || null}, ${a.description || null}, ${a.url || null}, ${a.publishedAt || null}, NOW())
      `);
    }
    return Promise.all(ops);
  });
}

export async function getNewsForPair(pairSymbol, limit = 10) {
  const pair = await getPairBySymbol(pairSymbol);
  if (!pair) return [];
  return await sql`SELECT * FROM news_items WHERE pair_id = ${pair.id} ORDER BY published_at DESC LIMIT ${limit}`;
}
