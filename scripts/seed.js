/**
 * Seed script for the Speedersmania marketplace.
 *
 * Replaces the old demo catalogue with a curated one and is SAFE TO RE-RUN:
 * products use deterministic IDs, so nothing is duplicated.
 *
 * Usage:
 *   npm run seed            # replace demo products + refresh vendor/categories
 *   npm run seed -- --keep  # keep existing demo products (only add/update)
 *
 * What it touches:
 *   - deletes products whose vendorId is `demo-vendor` (the old seed data),
 *   - upserts the `demo-vendor` store document,
 *   - upserts the six storefront categories,
 *   - upserts every product from scripts/catalog.json.
 *
 * It never touches products belonging to real vendors.
 *
 * Credentials: FIREBASE_SERVICE_ACCOUNT env var (JSON string) or a local
 * `*firebase-adminsdk*.json` key in the project root (not committed).
 */
import admin from 'firebase-admin';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('[seed] Invalid FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    }
  }
  const candidate = readdirSync(root)
    .filter((f) => f.endsWith('.json') && f.includes('firebase-adminsdk'))
    .sort()
    .pop();
  if (candidate) return JSON.parse(readFileSync(join(root, candidate), 'utf8'));
  return JSON.parse(readFileSync(join(root, 'serviceAccountKey.json'), 'utf8'));
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount()) });
}
const db = admin.firestore();

const CATALOG = JSON.parse(readFileSync(join(__dirname, 'catalog.json'), 'utf8'));
const DEMO_VENDOR_ID = 'demo-vendor';
const KEEP_EXISTING = process.argv.includes('--keep');

const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', description: 'Gadgets, devices & accessories', image: '/catalog/p78-1.webp', sortOrder: 1 },
  { id: 'fashion', name: 'Fashion', description: 'Clothing, footwear & style', image: '/catalog/p88-1.webp', sortOrder: 2 },
  { id: 'home', name: 'Home & Living', description: 'Furniture, decor & essentials', image: '/catalog/p12-1.webp', sortOrder: 3 },
  { id: 'sports', name: 'Sports', description: 'Gear & active living', image: '/catalog/p144-1.webp', sortOrder: 4 },
  { id: 'beauty', name: 'Beauty', description: 'Makeup, skincare & fragrance', image: '/catalog/p7-1.webp', sortOrder: 5 },
  { id: 'books', name: 'Books', description: 'Books & media', image: '/catalog/book-1-1.jpg', sortOrder: 6 },
];

const VENDOR = {
  storeName: 'Speedersmania Store',
  description: 'The flagship Speedersmania store — everyday essentials and premium picks, shipped across India.',
  logo: '/catalog/store-logo.svg',
  verified: true,
  rating: 4.7,
  totalProducts: CATALOG.length,
  totalSales: 1284,
  commissionRate: 0,
  status: 'active',
};

const toProductDoc = (p, now) => {
  const { createdAtOffsetMs = 0, _cover, ...rest } = p;
  return {
    ...rest,
    createdAt: admin.firestore.Timestamp.fromMillis(now - createdAtOffsetMs),
    updatedAt: admin.firestore.Timestamp.fromMillis(now - createdAtOffsetMs),
  };
};

async function purgeDemoProducts() {
  const snap = await db.collection('products').where('vendorId', '==', DEMO_VENDOR_ID).get();
  if (snap.empty) {
    console.log('   no demo products to delete');
    return 0;
  }
  console.log(`   deleting ${snap.size} demo products…`);
  snap.docs.forEach((d) => console.log(`   - ${d.data().name} (${d.id})`));
  let batch = db.batch();
  let n = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    if (++n % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  return snap.size;
}

async function seed() {
  const now = Date.now();
  const ts = admin.firestore.FieldValue.serverTimestamp();

  console.log('🌱 Seeding Speedersmania…\n');

  if (!KEEP_EXISTING) {
    console.log('🧹 Removing old demo catalogue');
    const removed = await purgeDemoProducts();
    console.log(`   removed ${removed}\n`);
  }

  console.log('🏪 Vendor');
  await db.collection('vendors').doc(DEMO_VENDOR_ID).set({ ...VENDOR, updatedAt: ts }, { merge: true });
  console.log(`   ${VENDOR.storeName} (${DEMO_VENDOR_ID})\n`);

  console.log('🗂  Categories');
  for (const c of CATEGORIES) {
    const { id, ...data } = c;
    await db.collection('categories').doc(id).set({ ...data, createdAt: ts, updatedAt: ts }, { merge: true });
    console.log(`   ${c.name}`);
  }

  console.log('\n📦 Products');
  let count = 0;
  for (const p of CATALOG) {
    const ref = db.collection('products').doc(p.id);
    await ref.set(toProductDoc(p, now));
    count++;
  }
  console.log(`   wrote ${count} products`);

  await db.collection('vendors').doc(DEMO_VENDOR_ID).set({ totalProducts: count, updatedAt: ts }, { merge: true });

  console.log(`\n🎉 Done. ${CATEGORIES.length} categories, ${count} products from the demo catalogue.`);
  console.log('   Real vendor products were left untouched.');
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
