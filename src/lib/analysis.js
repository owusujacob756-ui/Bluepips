import sql from '../app/api/utils/sql';

export async function createAnalysis({ pairId, timeframe = null, technical = null, fundamental = null, overall = null, confidence = null, details = null }) {
  const insert = await sql`
    INSERT INTO analysis (pair_id, timeframe, technical, fundamental, overall_recommendation, confidence, details)
    VALUES (${pairId}, ${timeframe}, ${technical ? JSON.stringify(technical) : null}, ${fundamental ? JSON.stringify(fundamental) : null}, ${overall}, ${confidence}, ${details ? JSON.stringify(details) : null})
    RETURNING id
  `;

  return insert && insert[0] ? insert[0].id : null;
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
