import { fetchNewsForPair } from '../src/lib/news.js';
import { saveNewsItems } from '../src/lib/analysis.js';
import { getForexPairs } from '../src/lib/db.js';

(async () => {
  try {
    const pairs = await getForexPairs();
    for (const p of pairs) {
      const articles = await fetchNewsForPair(p.symbol);
      if (articles && articles.length) {
        await saveNewsItems(p.id, articles);
        console.log(`Saved ${articles.length} articles for ${p.symbol}`);
      }
    }
    // record last run
    import { recordNewsSync } from '../src/lib/jobs.js';
    recordNewsSync();
    console.log('News sync finished');
  } catch (err) {
    console.error('Error during news sync:', err);
    process.exit(1);
  }
})();