import * as newsapi from './news.js';

const provider = process.env.NEWS_PROVIDER || 'newsapi';

export async function fetchNewsForPair(pair) {
  if (provider === 'newsapi') return newsapi.fetchNewsForPair(pair);
  // Future: add Google News scraping adapter here
  return newsapi.fetchNewsForPair(pair);
}
