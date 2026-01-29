const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// Simple in-memory cache with TTL
const cache = new Map();
function setCache(key, value, ttl = 300000) { // default 5min
  cache.set(key, { value, expireAt: Date.now() + ttl });
}
function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expireAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

async function fetchWithRetry(url, options = {}, attempts = 3, backoff = 300) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, backoff * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

let concurrentRequests = 0;
const MAX_CONCURRENT = parseInt(process.env.AI_MAX_CONCURRENT || '2', 10);
const metrics = { calls: 0, errors: 0 };

async function callOpenAI(messages, model = process.env.AI_MODEL || 'gpt-4o-mini') {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // Fallback stub when no key is provided
    return { content: JSON.stringify({ recommendation: 'hold', confidence: 50.0, summary: 'OpenAI key not set — returning a neutral stub summary.' }) };
  }

  const cacheKey = `openai:${model}:${JSON.stringify(messages).slice(0, 1000)}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Simple concurrency limiter
  const start = Date.now();
  while (concurrentRequests >= MAX_CONCURRENT) {
    if (Date.now() - start > 10000) throw new Error('OpenAI concurrency wait timeout');
    await new Promise(r => setTimeout(r, 100));
  }

  concurrentRequests++;
  metrics.calls++;
  try {
    const body = JSON.stringify({ model, messages, temperature: 0.2 });
    const payload = await fetchWithRetry(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body
    }, 3, 300);

    const assistant = payload?.choices?.[0]?.message?.content;
    const result = { content: assistant };
    setCache(cacheKey, result, 3 * 60 * 1000); // cache 3min
    return result;
  } catch (err) {
    metrics.errors++;
    throw err;
  } finally {
    concurrentRequests--;
  }
}

export function _test_getMetrics() { return { ...metrics, concurrent: concurrentRequests }; }

export async function analyzeTechnical({ pair, timeframe, priceHistory }) {
  const priceSummary = priceHistory.slice(-50).map(p => `${p.timestamp} ${p.open} ${p.high} ${p.low} ${p.close}`).join('\n');
  const messages = [
    { role: 'system', content: 'You are a professional forex technical analyst. Use common indicators: RSI, MACD, EMAs, Bollinger Bands. Provide recommendation BUY/SELL/HOLD with confidence percentage, top indicators, entry/stop-loss/take-profit levels and a short summary in JSON.' },
    { role: 'user', content: `Analyze pair ${pair} on timeframe ${timeframe} given recent price data:\n${priceSummary}` }
  ];

  try {
    const result = await callOpenAI(messages);
    const parsed = JSON.parse(result.content || '{}');
    // Normalize result
    return {
      recommendation: parsed.recommendation || parsed.action || 'hold',
      confidence: parsed.confidence || parsed.confidence_percentage || 50,
      indicators: parsed.indicators || parsed.technical || null,
      summary: parsed.summary || result.content || ''
    };
  } catch (err) {
    // Fallback: stub
    return { recommendation: 'hold', confidence: 50, summary: 'AI unavailable — returning neutral stub.' };
  }
}

export async function analyzeFundamental({ pair, newsItems }) {
  const newsSummary = newsItems.slice(0, 10).map(a => `${a.source}: ${a.title} - ${a.description || ''}`).join('\n');
  const messages = [
    { role: 'system', content: 'You are a professional macro/fundamental analyst. Summarize news and provide sentiment (bullish/bearish/neutral), impact (high/medium/low), and a short summary in JSON.' },
    { role: 'user', content: `Analyze ${pair} based on these news items:\n${newsSummary}` }
  ];

  try {
    const result = await callOpenAI(messages, process.env.FUNDAMENTAL_MODEL || process.env.AI_MODEL);
    const parsed = JSON.parse(result.content || '{}');
    return {
      sentiment: parsed.sentiment || parsed.overall_sentiment || 'neutral',
      impact: parsed.impact || 'medium',
      confidence: parsed.confidence || 50,
      summary: parsed.summary || result.content || ''
    };
  } catch (err) {
    return { sentiment: 'neutral', impact: 'medium', confidence: 50, summary: 'AI unavailable — returning neutral stub.' };
  }
}

export function _test_clearCache() { cache.clear(); }
