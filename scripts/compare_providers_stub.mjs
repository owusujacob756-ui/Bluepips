import fs from 'fs';
import * as aiProvider from '../src/lib/aiProvider.js';

const SAMPLE_PAIRS = ['EUR/USD','USD/JPY','GBP/USD'];
const SAMPLE_TIMEFRAMES = ['1H','4H','1D'];
const providers = ['openai','anthropic','gemini'];

async function run() {
  const results = [];
  for (const p of providers) {
    for (const pair of SAMPLE_PAIRS) {
      for (const tf of SAMPLE_TIMEFRAMES) {
        process.env.AI_PROVIDER = p;
        try {
          const tech = await aiProvider.analyzeTechnical({ pair, timeframe: tf, priceHistory: [] });
          const fund = await aiProvider.analyzeFundamental({ pair, newsItems: [] });
          results.push({ provider: p, pair, timeframe: tf, tech, fund });
        } catch (err) {
          results.push({ provider: p, pair, timeframe: tf, error: err.message });
        }
      }
    }
  }
  fs.writeFileSync('scripts/compare_results_stub.json', JSON.stringify({ meta: { providers, pairs: SAMPLE_PAIRS, timeframes: SAMPLE_TIMEFRAMES }, results }, null, 2));
  console.log('Wrote scripts/compare_results_stub.json');
}

run().catch(err => { console.error(err); process.exit(1); });