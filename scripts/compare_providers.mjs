import fs from 'fs';
import * as aiProvider from '../src/lib/aiProvider.js';

const SAMPLE_PAIRS = (process.env.SAMPLE_PAIRS || 'EUR/USD,USD/JPY,GBP/USD').split(',');
const SAMPLE_TIMEFRAMES = (process.env.SAMPLE_TIMEFRAMES || '1H,4H,1D').split(',');
const providersToRun = (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== 'all') ? [process.env.AI_PROVIDER] : ['openai', 'anthropic', 'gemini'];

async function runSample(provider, pair = 'EUR/USD', timeframe = '1H') {
  process.env.AI_PROVIDER = provider;
  const tech = await aiProvider.analyzeTechnical({ pair, timeframe, priceHistory: [] });
  const fund = await aiProvider.analyzeFundamental({ pair, newsItems: [] });
  return { provider, pair, timeframe, tech, fund };
}

(async () => {
  try {
    console.log('Running provider comparison for:', providersToRun.join(', '));
    const results = [];
    console.log('Attempting to initialize compare_results.json');
    try {
      fs.writeFileSync('scripts/compare_results.json', JSON.stringify({ meta: { providers: providersToRun, pairs: SAMPLE_PAIRS, timeframes: SAMPLE_TIMEFRAMES }, results: [] }, null, 2));
      console.log('Initialized compare_results.json');
    } catch (err) {
      console.error('Failed to initialize compare_results.json:', err);
      throw err;
    }

    for (const provider of providersToRun) {
      for (const pair of SAMPLE_PAIRS) {
        for (const tf of SAMPLE_TIMEFRAMES) {
          console.log(`Running ${provider} ${pair} ${tf}`);
          try {
            const r = await runSample(provider, pair, tf);
            results.push(r);
            // append partial results for visibility
            fs.writeFileSync('scripts/compare_results.json', JSON.stringify({ meta: { providers: providersToRun, pairs: SAMPLE_PAIRS, timeframes: SAMPLE_TIMEFRAMES }, results }, null, 2));
          } catch (err) {
            console.error(`Error running ${provider} ${pair} ${tf}:`, err.message);
          }
          // small cooldown
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    console.log('Wrote scripts/compare_results.json');
  } catch (err) {
    console.error('Provider comparison failed:', err);
    process.exitCode = 1;
  }
})();