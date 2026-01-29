// Google Gemini adapter
// Minimal implementation for the Gemini API. The SDK and endpoint vary; this
// uses a generic HTTP call and falls back to a safe stub when no key is set.

const GEMINI_ENDPOINT = process.env.GOOGLE_GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.0:generateText';

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
  const apiKey = process.env.GOOGLE_GEMINI_KEY;
  if (!apiKey) {
    return { recommendation: 'hold', confidence: 50, summary: 'Gemini key not set — returning neutral stub.' };
  }

  const prompt = `You are a professional forex technical analyst. Return JSON with recommendation, confidence, indicators, and summary.\nPair: ${pair}\nTimeframe: ${timeframe}\nPrices:\n${priceHistory.slice(-50).map(p => `${p.timestamp} ${p.open} ${p.high} ${p.low} ${p.close}`).join('\n')}`;

  try {
    const payload = await fetchWithRetry(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ prompt: { text: prompt }, temperature: 0.2, maxOutputTokens: 512 })
    });

    // Extract text from different possible Gemini response shapes
    const text = (function extractText(p) {
      if (!p) return '';
      // common shapes: p.candidates[0].output, p.candidates[0].content.text, p.output[0].content[0].text
      const c1 = p?.candidates?.[0]?.output;
      if (c1 && typeof c1 === 'string') return c1;
      const c2 = p?.candidates?.[0]?.content?.[0]?.text;
      if (c2) return c2;
      const c3 = p?.output?.[0]?.content?.[0]?.text;
      if (c3) return c3;
      // fallback to stringified payload
      return JSON.stringify(p);
    })(payload);

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
    console.error('Gemini analyzeTechnical error:', err.message);
    return { recommendation: 'hold', confidence: 50, summary: 'Gemini request failed — returning neutral stub.' };
  }
}

export async function analyzeFundamental({ pair, newsItems }) {
  const apiKey = process.env.GOOGLE_GEMINI_KEY;
  if (!apiKey) {
    return { sentiment: 'neutral', impact: 'medium', confidence: 50, summary: 'Gemini key not set — returning neutral stub.' };
  }

  const newsSummary = (newsItems || []).slice(0, 10).map(a => `${a.source}: ${a.title}`).join('\n');
  const prompt = `You are a professional macro/fundamental analyst. Return JSON with sentiment, impact, confidence, and summary.\nPair: ${pair}\nNews:\n${newsSummary}`;

  try {
    const payload = await fetchWithRetry(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ prompt: { text: prompt }, temperature: 0.2, maxOutputTokens: 512 })
    });

    const text = (function extractText(p) {
      if (!p) return '';
      const c1 = p?.candidates?.[0]?.output;
      if (c1 && typeof c1 === 'string') return c1;
      const c2 = p?.candidates?.[0]?.content?.[0]?.text;
      if (c2) return c2;
      const c3 = p?.output?.[0]?.content?.[0]?.text;
      if (c3) return c3;
      return JSON.stringify(p);
    })(payload);

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
    console.error('Gemini analyzeFundamental error:', err.message);
    return { sentiment: 'neutral', impact: 'medium', confidence: 50, summary: 'Gemini request failed — returning neutral stub.' };
  }
}
