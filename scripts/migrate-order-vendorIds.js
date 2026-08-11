// Backfills the `vendorIds` array on legacy orders (created before that field
// existed) so the vendor read/update rules + array-contains queries work.
// Usage: node scripts/migrate-order-vendorIds.js
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import admin from 'firebase-admin';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
const sa = raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(readFileSync(raw, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  const snap = await db.collection('orders').get();
  let updated = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (Array.isArray(data.vendorIds) && data.vendorIds.length > 0) continue;
    const vendorIds = [...new Set((data.items || []).map((i) => i.vendorId).filter(Boolean))];
    if (vendorIds.length > 0) {
      await d.ref.update({ vendorIds, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      updated++;
      console.log(`updated ${d.id} -> vendorIds=${JSON.stringify(vendorIds)}`);
    }
  }
  console.log(`done: ${updated} orders backfilled`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
