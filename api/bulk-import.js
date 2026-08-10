const admin = require('firebase-admin');
const axios = require('axios');
const cheerio = require('cheerio');

if (!admin.apps || !admin.apps.length) {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  let serviceAccount = null;

  if (serviceAccountStr) {
    try {
      serviceAccount = JSON.parse(serviceAccountStr);
    } catch (e) {
      console.error('[bulk-import] Invalid FIREBASE_SERVICE_ACCOUNT format:', e.message);
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[bulk-import] Firebase initialized with service account');
  } else if (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) {
    admin.initializeApp();
    console.log('[bulk-import] Firebase initialized with application default credentials');
  } else {
    console.warn('[bulk-import] No Firebase credentials found. API calls will fail.');
  }
}

const db = admin.apps && admin.apps.length ? admin.firestore() : null;
const PRODUCTS_COLLECTION = 'products'; // root collection (matches client)

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
      let src = $(el).attr('src');
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
    if (el.length) {
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
    if (el.length) {
      if (selector.startsWith('meta')) {
        const content = el.attr('content');
        if (content && content.trim().length > 20) {
          return content.trim();
        }
      } else {
        const text = el.first().text().trim();
        if (text.length > 20) return text;
      }
    }
  }

  return '';
}

function extractTitle($) {
  const title = $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('[itemprop="name"]').text().trim();
  return title || 'Imported Product';
}

function extractCategory($) {
  const cat = $('meta[property="product:category"]').attr('content') ||
    $('[itemprop="category"]').text().trim() ||
    $('[data-category]').attr('data-category');
  return cat || 'general';
}

// Scrape one URL and build the (pre-markup) product shape + extracted fields.
async function scrapeProduct(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
    },
    timeout: 15000,
    maxRedirects: 5,
  });

  const $ = cheerio.load(response.data);

  const title = extractTitle($) || $('title').text().trim() || 'Imported Product';
  let description = extractDescription($);
  description = description || $('meta[name="description"]').attr('content') || '';

  let price = extractPrice($);
  const images = extractImageUrls($);
  const category = extractCategory($);

  if (!images.length) {
    images.push('https://picsum.photos/seed/placeholder/400/400');
  }

  return { title, description, price, images, category };
}

// Process one URL end-to-end: scrape, apply markup, write to Firestore.
async function importOne(url, { vendorId, vendorName, markupPercentage }) {
  const { title, description, price: basePrice, images, category } = await scrapeProduct(url);

  // Retail price = base + markup% (only applied when a real price was found).
  const markup = basePrice > 0 ? Math.round(basePrice * (1 + (markupPercentage || 0) / 100) * 100) / 100 : 0;

  const productDoc = {
    name: title.trim(),
    description: description.trim(),
    price: markup,
    originalPrice: basePrice,
    category: category,
    images: images,
    image: images[0] || '',
    vendorId: vendorId,
    vendorName: vendorName,
    stock: 0,
    rating: 0,
    reviewCount: 0,
    soldCount: 0,
    discount: markup > basePrice ? Math.round(((markup - basePrice) / markup) * 100) : 0,
    active: false,
    importedFrom: url,
    markupPercentage: markupPercentage || 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection(PRODUCTS_COLLECTION).add(productDoc);
  console.log(`[bulk-import] Created product ${docRef.id} for vendor ${vendorId} from ${url}`);

  return {
    productId: docRef.id,
    product: {
      id: docRef.id,
      ...productDoc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!db) {
    return res.status(500).json({
      error: 'Firebase is not initialized. Please set FIREBASE_SERVICE_ACCOUNT environment variable.',
      details: 'See Vercel dashboard → Settings → Environment Variables'
    });
  }

  try {
    const { urls, vendorId, vendorName, markupPercentage = 20 } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'urls must be a non-empty array' });
    }
    if (!vendorId) {
      return res.status(400).json({ error: 'vendorId is required' });
    }
    if (!vendorName) {
      return res.status(400).json({ error: 'vendorName is required' });
    }

    const cleanUrls = [...new Set(urls.map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean))];

    const results = await mapLimit(cleanUrls, CONCURRENCY, (url) =>
      importOne(url, { vendorId, vendorName, markupPercentage })
    );

    const products = [];
    const errors = [];

    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value) {
        products.push(r.value);
      } else {
        const url = cleanUrls[results.indexOf(r)];
        const message = r.error?.message || 'Failed to import';
        if (r.error?.code === 'ECONNABORTED') {
          errors.push({ url, error: 'Request timeout' });
        } else if (r.error?.response?.status === 404) {
          errors.push({ url, error: 'URL returned 404' });
        } else if (r.error?.response?.status === 403) {
          errors.push({ url, error: 'Access denied (site blocks scrapers)' });
        } else if (r.error?.code === 'ENOTFOUND' || r.error?.code === 'EAI_AGAIN') {
          errors.push({ url, error: 'Could not resolve URL' });
        } else {
          errors.push({ url, error: message });
        }
      }
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
  } catch (error) {
    console.error('[bulk-import] Error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to bulk import products' });
  }
};