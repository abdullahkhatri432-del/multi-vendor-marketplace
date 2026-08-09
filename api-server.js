import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Default markup percentage for wholesalers (can be overridden per vendor)
const DEFAULT_MARKUP_PERCENTAGE = 20; // 20% markup

app.use(cors());
app.use(express.json());

if (!admin.apps || !admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
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
        const content = el.attr('content') || (el.attr('property') === 'og:description' && el.attr('content'));
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

app.post('/api/import-product', async (req, res) => {
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

    const savedDoc = await docRef.get();
    const productData = savedDoc.data();

    return res.json({
      success: true,
      productId: docRef.id,
      product: {
        id: docRef.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        originalPrice: productData.originalPrice,
        category: productData.category,
        images: productData.images,
        image: productData.image,
        vendorId: productData.vendorId,
        vendorName: productData.vendorName,
        stock: productData.stock,
        rating: productData.rating,
        reviewCount: productData.reviewCount,
        soldCount: productData.soldCount,
        discount: productData.discount,
        active: productData.active,
        importedFrom: productData.importedFrom,
        createdAt: productData.createdAt?.toDate?.() || new Date().toISOString(),
        updatedAt: productData.updatedAt?.toDate?.() || new Date().toISOString(),
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
});

// ===================== BULK IMPORT ENDPOINT =====================
app.post('/api/bulk-import', async (req, res) => {
  try {
    const { urls, vendorId, vendorName, markupPercentage = DEFAULT_MARKUP_PERCENTAGE } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Array of URLs is required' });
    }
    if (!vendorId) {
      return res.status(400).json({ error: 'vendorId is required' });
    }
    if (!vendorName) {
      return res.status(400).json({ error: 'vendorName is required' });
    }

    // Validate URLs
    const validUrls = urls
      .map(u => u.trim())
      .filter(u => u.length > 0)
      .map(u => {
        try {
          new URL(u);
          return u;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (validUrls.length === 0) {
      return res.status(400).json({ error: 'No valid URLs provided' });
    }

    console.log(`[bulk-import] Processing ${validUrls.length} URLs for vendor ${vendorId}`);

    // Scrape all URLs concurrently with Promise.allSettled
    const scrapePromises = validUrls.map(async (url, index) => {
      try {
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
        const scrapedPrice = extractPrice($);
        const images = extractImageUrls($);
        const category = extractCategory($);

        // Apply markup to scraped price
        const finalPrice = scrapedPrice > 0 
          ? Math.round(scrapedPrice * (1 + markupPercentage / 100) * 100) / 100
          : 0;

        if (!images.length) {
          images.push('https://picsum.photos/seed/placeholder/400/400');
        }

        const productDoc = {
          name: title.trim(),
          description: description.trim(),
          price: finalPrice,
          originalPrice: finalPrice, // For display as "original" in draft
          scrapedPrice: scrapedPrice, // Store original scraped price for reference
          markupPercentage,
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
          status: 'draft',
          importedFrom: url,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection(`${PROJECT_PATH}/pending_products`).add(productDoc);
        const savedDoc = await docRef.get();
        const productData = savedDoc.data();

        return {
          status: 'fulfilled',
          index,
          url,
          productId: docRef.id,
          product: {
            id: docRef.id,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            originalPrice: productData.originalPrice,
            scrapedPrice: productData.scrapedPrice,
            markupPercentage: productData.markupPercentage,
            category: productData.category,
            images: productData.images,
            image: productData.image,
            vendorId: productData.vendorId,
            vendorName: productData.vendorName,
            stock: productData.stock,
            rating: productData.rating,
            reviewCount: productData.reviewCount,
            soldCount: productData.soldCount,
            discount: productData.discount,
            active: productData.active,
            status: productData.status,
            importedFrom: productData.importedFrom,
            createdAt: productData.createdAt?.toDate?.() || new Date().toISOString(),
            updatedAt: productData.updatedAt?.toDate?.() || new Date().toISOString(),
          }
        };
      } catch (error) {
        console.error(`[bulk-import] Failed for URL ${url}:`, error.message);
        return {
          status: 'rejected',
          index,
          url,
          error: getScrapingErrorMessage(error)
        };
      }
    });

    const results = await Promise.allSettled(scrapePromises);
    
    // Process results
    const successful = [];
    const failed = [];
    
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          index: i,
          url: validUrls[i],
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    return res.json({
      success: true,
      summary: {
        total: validUrls.length,
        successful: successful.length,
        failed: failed.length,
        markupPercentage
      },
      products: successful,
      errors: failed
    });
  } catch (error) {
    console.error('[bulk-import] Error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to process bulk import' });
  }
});

function getScrapingErrorMessage(error) {
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. The URL may be taking too long to respond.';
  }
  if (error.response?.status === 404) {
    return 'The provided URL returned a 404. Please check the URL.';
  }
  if (error.response?.status === 403) {
    return 'Access denied when scraping the URL. The site may block scrapers.';
  }
  if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    return 'Could not resolve the URL. Please enter a valid URL.';
  }
  return error.message || 'Failed to import product';
}

app.listen(PORT, () => {
  console.log(`[api-server] Import product API listening on port ${PORT}`);
});
