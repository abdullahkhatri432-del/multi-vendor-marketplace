const admin = require('firebase-admin');
const axios = require('axios');
const cheerio = require('cheerio');

if (!admin.apps || !admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();
const PROJECT_PATH = 'projects/multi-vendor-marketplace';

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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, vendorId, vendorName } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    if (!vendorId) {
      return res.status(400).json({ error: 'vendorId is required' });
    }
    if (!vendorName) {
      return res.status(400).json({ error: 'vendorName is required' });
    }

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

    const html = response.data;
    const $ = cheerio.load(html);

    const title = extractTitle($) || $('title').text().trim() || 'Imported Product';
    let description = extractDescription($);
    const price = extractPrice($);
    const images = extractImageUrls($);
    const category = extractCategory($);

    if (!images.length) {
      images.push('https://picsum.photos/seed/placeholder/400/400');
    }

    description = description || $('meta[name="description"]').attr('content') || '';

    const productDoc = {
      name: title.trim(),
      description: description.trim(),
      price: price || 0,
      originalPrice: price || 0,
      category: category,
      images: images,
      image: images[0] || '',
      vendorId: vendorId,
      vendorName: vendorName,
      stock: 0,
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
      discount: 0,
      active: false,
      importedFrom: url,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(`${PROJECT_PATH}/products`).add(productDoc);

    console.log(`[import-product] Created product ${docRef.id} for vendor ${vendorId} from ${url}`);

    return res.status(200).json({
      success: true,
      productId: docRef.id,
      product: {
        id: docRef.id,
        ...productDoc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[import-product] Error:', error.message);

    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Request timeout. The URL may be taking too long to respond.' });
    }
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'The provided URL returned a 404. Please check the URL.' });
    }
    if (error.response?.status === 403) {
      return res.status(403).json({ error: 'Access denied when scraping the URL. The site may block scrapers.' });
    }
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      return res.status(400).json({ error: 'Could not resolve the URL. Please enter a valid URL.' });
    }

    return res.status(500).json({ error: error.message || 'Failed to import product' });
  }
};
