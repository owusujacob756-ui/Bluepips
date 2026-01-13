import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

sql.transaction = async (queries) => {
  return sql.begin(async (txn) => {
    if (typeof queries === 'function') {
      return queries(txn);
    }
    return Promise.all(queries);
  });
};

export default sql;
