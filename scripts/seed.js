/**
 * Seed script for the Speedersmania marketplace.
 *
 * Populates a FRESH (empty) Firestore database with initial categories and
 * sample products so the store isn't blank. Uses ROOT-level collections to
 * match the current client (src/config/firestore.js).
 *
 * Usage:
 *   npm run seed
 *   OR
 *   node scripts/seed.js
 *
 * Credentials: reads FIREBASE_SERVICE_ACCOUNT env var (JSON string), or the
 * local serviceAccountKey.json file. This file is NOT committed to git.
 */
import admin from 'firebase-admin';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- Firebase Admin init ----------
function loadServiceAccount() {
  // 1) Prefer the env var (Vercel format).
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('[seed] Invalid FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    }
  }
  // 2) Any Firebase admin SDK key dropped in the project root.
  const root = join(__dirname, '..');
  const candidate = readdirSync(root)
    .filter((f) => f.endsWith('.json') && f.includes('firebase-adminsdk'))
    .sort()
    .pop();
  if (candidate) {
    return JSON.parse(readFileSync(join(root, candidate), 'utf8'));
  }
  // 3) Fallback to the legacy filename.
  const legacy = join(root, 'serviceAccountKey.json');
  return JSON.parse(readFileSync(legacy, 'utf8'));
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount()) });
}
const db = admin.firestore();

// ---------- Seed data ----------
const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', description: 'Gadgets, devices & accessories', image: 'https://picsum.photos/seed/electronics/600/400', sortOrder: 1 },
  { id: 'fashion', name: 'Fashion', description: 'Clothing, footwear & style', image: 'https://picsum.photos/seed/fashion/600/400', sortOrder: 2 },
  { id: 'home', name: 'Home & Living', description: 'Furniture, decor & essentials', image: 'https://picsum.photos/seed/home/600/400', sortOrder: 3 },
  { id: 'books', name: 'Books', description: 'Books & media', image: 'https://picsum.photos/seed/books/600/400', sortOrder: 4 },
  { id: 'sports', name: 'Sports & Outdoors', description: 'Gear & active living', image: 'https://picsum.photos/seed/sports/600/400', sortOrder: 5 },
];

const DEMO_VENDOR = { id: 'demo-vendor', vendorName: 'Speedersmania Store' };

function product(name, desc, price, category, seed, discount = 0, stock = 25) {
  const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : price;
  return {
    name,
    description: desc,
    price,
    originalPrice,
    discount,
    category,
    images: [`https://picsum.photos/seed/${seed}/800/600`, `https://picsum.photos/seed/${seed}-2/800/600`],
    image: `https://picsum.photos/seed/${seed}/800/600`,
    vendorId: DEMO_VENDOR.id,
    vendorName: DEMO_VENDOR.vendorName,
    stock,
    rating: 4.5,
    reviewCount: Math.floor(Math.random() * 120) + 5,
    soldCount: Math.floor(Math.random() * 300),
    active: true,
  };
}

const PRODUCTS = [
  product('Wireless Bluetooth Headphones', 'Over-ear headphones with active noise cancellation, 30h battery, and deep bass.', 99.99, 'electronics', 'headphones', 20),
  product('Smart Watch Series 8', 'AMOLED display, heart-rate & SpO2 tracking, water resistant to 50m.', 189.0, 'electronics', 'watch', 15, 40),
  product('Mechanical Gaming Keyboard', 'Hot-swappable switches, RGB backlight, aluminum body.', 79.0, 'electronics', 'keyboard', 10),
  product('Men’s Casual Oxford Shirt', 'Soft cotton, slim fit, machine washable. Available in multiple colors.', 34.5, 'fashion', 'shirt'),
  product('Women’s Running Sneakers', 'Lightweight mesh, cushioned sole, breathable for all-day wear.', 58.0, 'fashion', 'sneakers', 12, 30),
  product('Classic Denim Jacket', 'Timeless blue denim with a tapered fit and durable stitching.', 45.0, 'fashion', 'jacket'),
  product('Ceramic Coffee Mug Set (4)', 'Modern minimalist design, dishwasher-safe, 350ml capacity.', 24.0, 'home', 'mug', 5, 60),
  product('LED Floor Lamp', 'Dimmable, warm-white lighting with a sleek matte finish.', 66.0, 'home', 'lamp', 8, 15),
  product('Soft Throw Blanket', 'Premium faux-fur throw, super cozy for couches and beds.', 32.0, 'home', 'blanket'),
  product('Bestseller Hardcover Novel', 'A gripping page-turner — perfect for every bookshelf.', 18.0, 'books', 'book', 25, 100),
  product('Yoga Mat, Non-Slip', 'Eco-friendly, extra thick, includes carry strap.', 29.0, 'sports', 'yoga', 0, 50),
  product('Adjustable Dumbbell Set', 'Space-saving adjustable dumbbells from 5–25 kg.', 149.0, 'sports', 'dumbbell', 10, 10),
];

// ---------- Run ----------
async function seed() {
  const ts = admin.firestore.FieldValue.serverTimestamp();

  console.log('🌱 Seeding database...\n');

  // Categories (deterministic IDs)
  for (const c of CATEGORIES) {
    const { id, ...data } = c;
    await db.collection('categories').doc(id).set({ ...data, createdAt: ts, updatedAt: ts });
    console.log(`✅ Category: ${c.name}`);
  }

  // Products (auto-generated IDs)
  let created = 0;
  for (const p of PRODUCTS) {
    const ref = await db.collection('products').add({ ...p, createdAt: ts, updatedAt: ts });
    console.log(`✅ Product: ${p.name} → ${ref.id}`);
    created++;
  }

  console.log(`\n🎉 Done! Seeded ${CATEGORIES.length} categories + ${created} products.`);
  console.log('   Collections now visible in Firestore console: categories, products.');
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});