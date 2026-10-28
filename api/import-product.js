// Scrapes product info from a public e-commerce URL and returns it to the
// client. The client saves the product via the Firestore SDK.
//
// Protected: requires a Firebase ID token and blocks SSRF (private IPs,
// metadata endpoints, non-standard ports).
const cheerio = require('cheerio');
const {
  HttpError,
  authenticate,
  applyCors,
  rateLimit,
  fetchHtml,
} = require('../lib/http.cjs');

const MAX_TEXT = 1000;

function extractImageUrls($) {
  const images = [];
  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr('content');
    if (content) images.push(content);
  });
  if (images.length === 0) {
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:') && src.length > 20) images.push(src);
    });
  }
  return images.slice(0, 5);
}

function extractPrice($) {
  const selectors = [
    'meta[property="product:price:amount"]',
    '[itemprop="price"]',
    '.price',
    '.price-current',
    '.amount',
    '[class*="price"]',
  ];
  for (const selector of selectors) {
    const el = $(selector);
    if (!el.length) continue;
    if (selector.startsWith('meta')) {
      const content = el.attr('content');
      if (content) {
        const price = parseFloat(content);
        if (!isNaN(price) && price > 0) return price;
      }
    } else {
      const match = el.first().text().trim().match(/[\d.,]+/);
      if (match) {
        const price = parseFloat(match[0].replace(/,/g, ''));
        if (!isNaN(price) && price > 0) return price;
      }
    }
  }
  return 0;
}

function extractDescription($) {
  const selectors = [
    'meta[name="description"]',
    'meta[property="og:description"]',
    '[itemprop="description"]',
    '.description',
    '#description',
    '.product-description',
  ];
  for (const selector of selectors) {
    const el = $(selector);
    if (!el.length) continue;
    if (selector.startsWith('meta')) {
      const content = el.attr('content');
      if (content && content.trim().length > 20) return content.trim();
    } else {
      const text = el.first().text().trim();
      if (text.length > 20) return text;
    }
  }
  return '';
}

function extractTitle($) {
  return (
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('[itemprop="name"]').text().trim() ||
    'Imported Product'
  );
}

function extractCategory($) {
  return (
    $('meta[property="product:category"]').attr('content') ||
    $('[itemprop="category"]').text().trim() ||
    $('[data-category]').attr('data-category') ||
    'general'
  );
}

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    rateLimit(req, { limit: 30, windowMs: 60_000, scope: 'import-product' });
    await authenticate(req);

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const url = String(body.url || '').trim();
    if (!url) throw new HttpError(400, 'URL is required');

    const html = await fetchHtml(url, { timeout: 15_000 });
    const $ = cheerio.load(html);

    const title = String(extractTitle($) || 'Imported Product').trim().slice(0, 200);
    let description = extractDescription($);
    description = (description || $('meta[name="description"]').attr('content') || '')
      .trim()
      .slice(0, 4000);
    const price = extractPrice($);
    const images = extractImageUrls($);
    const category = String(extractCategory($) || 'general').trim().slice(0, 80);

    if (!images.length) images.push('https://picsum.photos/seed/placeholder/400/400');

    return res.status(200).json({
      success: true,
      product: {
        name: title,
        description,
        price: price || 0,
        originalPrice: price || 0,
        category,
        images,
        image: images[0] || '',
        importedFrom: url,
      },
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) console.error('[import-product] Error:', err?.message);
    return res.status(status).json({
      error: status >= 500 ? 'Failed to import product' : err.message,
    });
  }
};
