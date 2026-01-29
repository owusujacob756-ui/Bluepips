import { setIntervalAsync } from 'set-interval-async/dynamic';
import { fetchNewsForPair } from '../src/lib/news.js';
import { saveNewsItems } from '../src/lib/analysis.js';
import { getForexPairs } from '../src/lib/db.js';

async function syncNews() {
  try {
    const pairs = await getForexPairs();
    for (const p of pairs) {
      const articles = await fetchNewsForPair(p.symbol);
      if (articles && articles.length) await saveNewsItems(p.id, articles);
    }
    console.log('News sync completed');
  } catch (err) {
    console.error('News sync error', err);
  }
}

(async function main() {
  await syncNews();
  // Run interval (default 10 minutes)
  const intervalMs = parseInt(process.env.JOBS_SYNC_INTERVAL_MS || String(10 * 60 * 1000), 10);
  const timer = setInterval(async () => { await syncNews(); }, intervalMs);

  const stop = async () => {
    clearInterval(timer);
    console.log('Background jobs stopped');
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();