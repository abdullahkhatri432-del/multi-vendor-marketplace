// Bulk-scrapes product pages and writes them to Firestore as draft products.
//
// Protected: requires a Firebase ID token. The vendor identity (uid, name) is
// taken from the token + Firestore vendor document, never from the client.
// Every URL goes through the SSRF-safe fetcher in lib/http.cjs.
const cheerio = require('cheerio');
const {
  HttpError,
  getDb,
  authenticate,
  applyCors,
  rateLimit,
  fetchHtml,
  FieldValue,
} = require('../lib/http.cjs');
const ops = require('../lib/ops.cjs');

const PRODUCTS_COLLECTION = 'products'; // root collection (matches client)
const MAX_URLS = 20;

// Limited concurrency so bulk imports stay inside Vercel's 30s maxDuration
// while still overlapping network time for many URLs.
const CONCURRENCY = 3;

function extractImageUrls($) {
  const images = [];

  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr('content');
    if (content) images.push(content);
  });

  if (images.length === 0) {
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:') && src.length > 20) {
        images.push(src);
      }
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
      const text = el.first().text().trim();
      const match = text.match(/[\d.,]+/);
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
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('[itemprop="name"]').text().trim();
  return title || 'Imported Product';
}

function extractCategory($) {
  const category =
    $('meta[property="product:category"]').attr('content') ||
    $('[itemprop="category"]').text().trim() ||
    $('[data-category]').attr('data-category');
  return category || 'general';
}

// Scrape one URL and build the (pre-markup) product shape + extracted fields.
async function scrapeProduct(url) {
  const html = await fetchHtml(url, { timeout: 15_000 });
  const $ = cheerio.load(html);

  const title = extractTitle($) || 'Imported Product';
  let description = extractDescription($);
  description = description || $('meta[name="description"]').attr('content') || '';

  const price = extractPrice($);
  const images = extractImageUrls($);
  const category = extractCategory($);

  if (!images.length) {
    images.push('https://picsum.photos/seed/placeholder/400/400');
  }

  return { title, description, price, images, category };
}

// Run a bounded number of async tasks at once. Resolves once all complete.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      try {
        results[current] = { status: 'fulfilled', value: await fn(items[current]) };
      } catch (error) {
        results[current] = { status: 'rejected', error };
      }
    }
  });

  await Promise.all(workers);
  return results;
}

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    rateLimit(req, { limit: 10, windowMs: 60_000, scope: 'bulk-import' });

    const db = getDb();
    const token = await authenticate(req);

    // Only real vendors may import into their own catalogue.
    const vendorSnap = await db.collection('vendors').doc(token.uid).get();
    if (!vendorSnap.exists) {
      throw new HttpError(403, 'Only registered vendors can import products.');
    }
    const vendor = vendorSnap.data() || {};
    const vendorId = token.uid;
    const vendorName = String(vendor.storeName || vendor.name || token.name || 'Vendor').slice(0, 120);

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { urls } = body;

    if (!Array.isArray(urls) || urls.length === 0) {
      throw new HttpError(400, 'urls must be a non-empty array');
    }

    const cleanUrls = [...new Set(urls.map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean))];
    if (cleanUrls.length === 0) {
      throw new HttpError(400, 'No valid URLs were provided.');
    }
    if (cleanUrls.length > MAX_URLS) {
      throw new HttpError(400, `You can import at most ${MAX_URLS} URLs at once.`);
    }

    const requestedMarkup = Number(body.markupPercentage);
    const markupPercentage = Number.isFinite(requestedMarkup)
      ? Math.min(500, Math.max(0, requestedMarkup))
      : 20;

    const results = await mapLimit(cleanUrls, CONCURRENCY, async (url) => {
      const { title, description, price: basePrice, images, category } = await scrapeProduct(url);

      // Retail price = base + markup% (only applied when a real price was found).
      const markup =
        basePrice > 0
          ? Math.round(basePrice * (1 + markupPercentage / 100) * 100) / 100
          : 0;

      const productDoc = {
        name: String(title).trim().slice(0, 200),
        description: String(description).trim().slice(0, 4000),
        price: markup,
        originalPrice: basePrice,
        category,
        images,
        image: images[0] || '',
        vendorId,
        vendorName,
        stock: 0,
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        discount:
          markup > basePrice ? Math.round(((markup - basePrice) / markup) * 100) : 0,
        active: false,
        importedFrom: url,
        markupPercentage,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection(PRODUCTS_COLLECTION).add(productDoc);

      return {
        productId: docRef.id,
        product: {
          id: docRef.id,
          ...productDoc,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    });

    const products = [];
    const errors = [];

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        products.push(result.value);
        return;
      }
      errors.push({
        url: cleanUrls[i],
        error: result.error?.message || 'Failed to import',
      });
    });

    return res.status(200).json({
      success: true,
      products,
      errors,
      summary: {
        total: cleanUrls.length,
        successful: products.length,
        failed: errors.length,
      },
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) {
      console.error('[bulk-import] Error:', err?.message);
      await ops.notifyOps({
        level: 'error',
        source: 'bulk-import',
        title: 'Bulk import failed (HTTP 500)',
        detail: ops.summarizeError(err),
      });
    }
    return res.status(status).json({
      error: status >= 500 ? 'Bulk import failed. Please try again.' : err.message,
    });
  }
};
