import { describe, it, expect } from 'vitest';
import * as aiProvider from '../src/lib/aiProvider.js';

describe('AI provider switching', () => {
  it('defaults to openai', async () => {
    process.env.AI_PROVIDER = '';
    const tech = await aiProvider.analyzeTechnical({ pair: 'EUR/USD', timeframe: '1H', priceHistory: [] });
    const fund = await aiProvider.analyzeFundamental({ pair: 'EUR/USD', newsItems: [] });
    expect(tech).toHaveProperty('recommendation');
    expect(fund).toHaveProperty('sentiment');
  });

  it('uses Anthropic when set', async () => {
    process.env.AI_PROVIDER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = '';
    const tech = await aiProvider.analyzeTechnical({ pair: 'EUR/USD', timeframe: '1H', priceHistory: [] });
    const fund = await aiProvider.analyzeFundamental({ pair: 'EUR/USD', newsItems: [] });
    expect(tech).toHaveProperty('recommendation');
    expect(fund).toHaveProperty('sentiment');
  });

  it('uses Gemini when set', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GOOGLE_GEMINI_KEY = '';
    const tech = await aiProvider.analyzeTechnical({ pair: 'EUR/USD', timeframe: '1H', priceHistory: [] });
    const fund = await aiProvider.analyzeFundamental({ pair: 'EUR/USD', newsItems: [] });
    expect(tech).toHaveProperty('recommendation');
    expect(fund).toHaveProperty('sentiment');
  });
});