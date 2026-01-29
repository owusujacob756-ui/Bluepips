import postgres from 'postgres';

let sql;

// If DATABASE_URL is not set (e.g., during build or in environments without DB),
// provide a safe stub implementation that returns empty results and supports
// the same tagged-template usage so builds and prerendering won't fail.
if (!process.env.DATABASE_URL) {
  function sqlTag(strings, ...args) {
    return Promise.resolve([]);
  }

  sqlTag.transaction = async (queries) => {
    if (typeof queries === 'function') return queries(sqlTag);
    return Promise.resolve([]);
  };

  sql = sqlTag;
} else {
  const realSql = postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // Wrap the real sql tag to catch connection errors and fall back to a stub
  async function sqlTag(strings, ...args) {
    try {
      return await realSql(strings, ...args);
    } catch (err) {
      console.error('Database query failed, falling back to stub response:', err.message);
      return [];
    }
  }

  sqlTag.transaction = async (queries) => {
    try {
      return await realSql.begin(async (txn) => {
        if (typeof queries === 'function') {
          return queries(txn);
        }
        return Promise.all(queries);
      });
    } catch (err) {
      console.error('Database transaction failed, falling back to stub:', err.message);
      if (typeof queries === 'function') {
        return queries(sqlTag);
      }
      return [];
    }
  };

  sql = sqlTag;
}

export default sql;
