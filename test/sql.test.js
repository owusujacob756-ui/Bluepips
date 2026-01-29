import { describe, it, expect } from 'vitest';

// We will dynamically import the module so process.env changes are respected
const importSql = async () => {
  // Clear require cache for the module so it picks current env
  const path = new URL('../src/app/api/utils/sql.js', import.meta.url).pathname;
  delete require.cache[path];
  return import('../src/app/api/utils/sql.js');
};

describe('sql utils fallback', async () => {
  it('returns a stub when DATABASE_URL is not set', async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const mod = await importSql();
    const sql = mod.default;

    const res = await sql`SELECT 1`;
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);

    process.env.DATABASE_URL = original;
  });

  it('provides a transaction method on the stub', async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const mod = await importSql();
    const sql = mod.default;

    const result = await sql.transaction(async (txn) => {
      const r = await txn`SELECT 1`;
      return r;
    });

    expect(Array.isArray(result)).toBe(true);

    process.env.DATABASE_URL = original;
  });
});