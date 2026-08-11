// Scrapes product info from an e-commerce URL and returns it to the client.
// The client saves the product via the Firestore SDK (no Firebase Admin / env vars needed).
// CommonJS (api/package.json sets "type": "commonjs") — matches bulk-import.js.
const axios = require('axios');
const cheerio = require('cheerio');

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = extractTitle($);
    let description = extractDescription($);
    const price = extractPrice($);
    const images = extractImageUrls($);
    const category = extractCategory($);

    if (!images.length) images.push('https://picsum.photos/seed/placeholder/400/400');
    description = description || $('meta[name="description"]').attr('content') || '';

    return res.status(200).json({
      success: true,
      product: {
        name: title.trim(),
        description: description.trim(),
        price: price || 0,
        originalPrice: price || 0,
        category,
        images,
        image: images[0] || '',
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
