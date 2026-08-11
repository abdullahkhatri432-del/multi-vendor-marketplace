// Regenerates public/sitemap.xml from Firestore products.
// Usage: node scripts/generate-sitemap.js
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import admin from 'firebase-admin';

const BASE = 'https://speedersmania.vercel.app';

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var missing (points to the service account JSON path or inline JSON).');
  process.exit(1);
}

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
const sa = raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(readFileSync(raw, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const staticPaths = [
  { path: '/', priority: '1.0' },
  { path: '/products', priority: '0.9' },
  { path: '/terms', priority: '0.3' },
  { path: '/privacy', priority: '0.3' },
];

const escapeXml = (s) =>
  String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

async function main() {
  const snap = await db.collection('products').where('active', '==', true).get();
  const urls = [];

  for (const { path, priority } of staticPaths) {
    urls.push(`  <url><loc>${BASE}${path}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`);
  }

  for (const d of snap.docs) {
    const data = d.data();
    const updated = data.updatedAt?.toDate?.()?.toISOString?.() || data.createdAt?.toDate?.()?.toISOString?.() || '';
    const lastmod = updated ? `<lastmod>${updated}</lastmod>` : '';
    urls.push(
      `  <url><loc>${BASE}/products/${escapeXml(d.id)}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
    '\n'
  )}\n</urlset>\n`;

  mkdirSync('public', { recursive: true });
  writeFileSync('public/sitemap.xml', xml, 'utf8');
  console.log(`sitemap.xml written: ${urls.length} URLs`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
