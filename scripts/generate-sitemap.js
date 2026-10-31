// Regenerates public/sitemap.xml from Firestore products, categories and
// vendors. Usage: node scripts/generate-sitemap.js
//
// Without FIREBASE_SERVICE_ACCOUNT the script still succeeds and writes a
// sitemap containing the public static routes, so a build never fails just
// because credentials are unavailable on a CI machine.
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const BASE = (process.env.VITE_SITE_URL || 'https://speedersmania.vercel.app').replace(/\/$/, '');

const staticPaths = [
  { path: '/', priority: '1.0' },
  { path: '/products', priority: '0.9' },
  { path: '/vendors', priority: '0.7' },
  { path: '/terms', priority: '0.3' },
  { path: '/privacy', priority: '0.3' },
];

const escapeXml = (s) =>
  String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function writeSitemap(urls) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
    '\n'
  )}\n</urlset>\n`;
  mkdirSync('public', { recursive: true });
  writeFileSync('public/sitemap.xml', xml, 'utf8');
  console.log(`sitemap.xml written: ${urls.length} URLs`);
}

const lastmodFor = (data) => {
  const iso =
    data?.updatedAt?.toDate?.()?.toISOString?.() ||
    data?.createdAt?.toDate?.()?.toISOString?.() ||
    '';
  return iso ? `<lastmod>${iso}</lastmod>` : '';
};

async function main() {
  const urls = staticPaths.map(
    ({ path, priority }) =>
      `  <url><loc>${BASE}${path}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`
  );

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT is not set — writing a static-only sitemap. ' +
        'Set it to include products, categories and vendor stores.'
    );
    writeSitemap(urls);
    return;
  }

  const { default: admin } = await import('firebase-admin');
  const sa = raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(readFileSync(raw, 'utf8'));
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
  const db = admin.firestore();

  const [productsSnap, vendorsSnap, categoriesSnap] = await Promise.all([
    db.collection('products').where('active', '==', true).get(),
    db.collection('vendors').get(),
    db.collection('categories').get().catch(() => ({ docs: [] })),
  ]);

  for (const d of productsSnap.docs) {
    urls.push(
      `  <url><loc>${BASE}/products/${escapeXml(d.id)}</loc>${lastmodFor(d.data())}<changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  }

  const seenVendors = new Set();
  for (const d of vendorsSnap.docs) {
    const data = d.data() || {};
    if (data.verified === false && data.isVerified === false) continue;
    if (data.status === 'pending' || data.status === 'suspended') continue;
    if (seenVendors.has(d.id)) continue;
    seenVendors.add(d.id);
    urls.push(
      `  <url><loc>${BASE}/vendor/${escapeXml(d.id)}</loc>${lastmodFor(data)}<changefreq>weekly</changefreq><priority>0.6</priority></url>`
    );
  }

  const seenCategories = new Set();
  for (const d of categoriesSnap.docs) {
    const data = d.data() || {};
    const slug = data.slug ? slugify(data.slug) : slugify(data.name || d.id);
    if (!slug || seenCategories.has(slug)) continue;
    seenCategories.add(slug);
    urls.push(
      `  <url><loc>${BASE}/products?category=${encodeURIComponent(slug)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`
    );
  }

  writeSitemap(urls);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
