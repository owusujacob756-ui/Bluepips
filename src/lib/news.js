const NEWSAPI_ENDPOINT = 'https://newsapi.org/v2/everything';

const cache = new Map();
function setCache(key, value, ttl = 5 * 60 * 1000) { cache.set(key, { value, expireAt: Date.now() + ttl }); }
function getCache(key) { const v = cache.get(key); if (!v) return null; if (Date.now() > v.expireAt) { cache.delete(key); return null; } return v.value; }

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

export async function fetchNewsForPair(pair) {
  const provider = process.env.NEWS_PROVIDER || 'newsapi';
  const cacheKey = `news:${provider}:${pair}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const key = process.env.NEWS_API_KEY;
  const query = `${pair} forex OR foreign exchange OR currency`;

  if (!key) {
    const stub = [{ source: 'stub', title: `No news key set — stub for ${pair}`, description: 'Set NEWS_API_KEY to enable live news fetching', url: '', publishedAt: null }];
    setCache(cacheKey, stub);
    return stub;
  }

  if (provider === 'newsapi') {
    const params = new URLSearchParams({ q: query, language: 'en', sortBy: 'publishedAt', pageSize: '10', apiKey: key });
    const payload = await fetchWithRetry(`${NEWSAPI_ENDPOINT}?${params.toString()}`, {}, 3, 300);
    const articles = (payload.articles || []).map(a => ({ source: a.source?.name || null, title: a.title, description: a.description, url: a.url, publishedAt: a.publishedAt }));
    // Deduplicate by URL
    const seen = new Set();
    const dedup = articles.filter(a => { if (!a.url) return false; if (seen.has(a.url)) return false; seen.add(a.url); return true; });
    setCache(cacheKey, dedup);

    // If high-impact news, fire optional webhook
    (async function fireWebhookIfNeeded() {
      try {
        const webhook = process.env.NEWS_WEBHOOK_URL;
        if (!webhook) return;
        const highImpactKeywords = ['interest rate', 'inflation', 'non-farm', 'nfp', 'central bank', 'fed', 'bank of england'];
        const high = dedup.some(a => highImpactKeywords.some(k => (a.title || '') .toLowerCase().includes(k)));
        if (high) {
          await fetchWithRetry(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pair, articles: dedup.slice(0,3) }) }, 2, 200);
        }
      } catch (err) {
        console.error('Failed to send news webhook:', err.message);
      }
    })();

    return dedup;
  }

  // Fallback
  const stub = [{ source: 'stub', title: `Provider ${provider} not implemented — stub for ${pair}`, description: '', url: '', publishedAt: null }];
  setCache(cacheKey, stub);
  return stub;
}

export function _test_clearCache() { cache.clear(); }