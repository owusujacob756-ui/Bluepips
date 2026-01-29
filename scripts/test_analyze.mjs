import { analyzeTechnical, analyzeFundamental } from '../src/lib/ai.js';

(async () => {
  try {
    const tech = await analyzeTechnical({ pair: 'EUR/USD', timeframe: '1H', priceHistory: [] });
    console.log('TECH RESULT', tech);

    const fund = await analyzeFundamental({ pair: 'EUR/USD', newsItems: [] });
    console.log('FUND RESULT', fund);
  } catch (err) {
    console.error('Error when running analyzers:', err);
    console.error(err.stack);
  }
})();