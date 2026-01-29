// Anthropic adapter
// Implements a small, resilient wrapper around Anthropic's completion API.
// NOTE: This is a minimal implementation to call Anthropic if ANTHROPIC_API_KEY
// is present. The exact request/response shape may need adjustments for newer
// Anthropic APIs - treat this code as a starter that falls back to safe stubs.

const ANTHROPIC_ENDPOINT = process.env.ANTHROPIC_ENDPOINT || 'https://api.anthropic.com/v1/complete';

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

export async function analyzeTechnical({ pair, timeframe, priceHistory }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { recommendation: 'hold', confidence: 50, summary: 'Anthropic key not set — returning neutral stub.' };
  }

  const prompt = `You are a professional forex technical analyst. Provide a JSON output with keys: recommendation (buy/sell/hold), confidence (0-100), indicators (object), summary (string).\nPair: ${pair}\nTimeframe: ${timeframe}\nPrice samples:\n${priceHistory.slice(-50).map(p => `${p.timestamp} ${p.open} ${p.high} ${p.low} ${p.close}`).join('\n')}`;

  try {
    const payload = await fetchWithRetry(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ prompt, model: process.env.ANTHROPIC_MODEL || 'claude-2' })
    });

    // Try to parse JSON from the model text
    const text = payload?.completion || JSON.stringify(payload);
    try {
      const parsed = JSON.parse(text);
      return {
        recommendation: parsed.recommendation || 'hold',
        confidence: parsed.confidence || 50,
        indicators: parsed.indicators || null,
        summary: parsed.summary || text
      };
    } catch (err) {
      return { recommendation: 'hold', confidence: 50, summary: text };
    }
  } catch (err) {
    console.error('Anthropic analyzeTechnical error:', err.message);
    return { recommendation: 'hold', confidence: 50, summary: 'Anthropic request failed — returning neutral stub.' };
  }
}

export async function analyzeFundamental({ pair, newsItems }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { sentiment: 'neutral', impact: 'medium', confidence: 50, summary: 'Anthropic key not set — returning neutral stub.' };
  }

  const newsSummary = (newsItems || []).slice(0, 10).map(a => `${a.source}: ${a.title} - ${a.description || ''}`).join('\n');
  const prompt = `You are a professional macro/fundamental analyst. Given news items, return JSON with sentiment (bullish/bearish/neutral), impact (high/medium/low), confidence (0-100), and summary.\nPair: ${pair}\nNews:\n${newsSummary}`;

  try {
    const payload = await fetchWithRetry(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ prompt, model: process.env.ANTHROPIC_MODEL || 'claude-2' })
    });

    const text = payload?.completion || JSON.stringify(payload);
    try {
      const parsed = JSON.parse(text);
      return {
        sentiment: parsed.sentiment || 'neutral',
        impact: parsed.impact || 'medium',
        confidence: parsed.confidence || 50,
        summary: parsed.summary || text
      };
    } catch (err) {
      return { sentiment: 'neutral', impact: 'medium', confidence: 50, summary: text };
    }
  } catch (err) {
    console.error('Anthropic analyzeFundamental error:', err.message);
    return { sentiment: 'neutral', impact: 'medium', confidence: 50, summary: 'Anthropic request failed — returning neutral stub.' };
  }
}
