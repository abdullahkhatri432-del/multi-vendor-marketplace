// Daily encrypted Firestore backup.
//
// Triggered by the Vercel cron declared in vercel.json (Authorization:
// Bearer $CRON_SECRET). Each collection is exported, tagged so Firestore
// Timestamps/refs survive JSON, encrypted with AES-256-GCM and written to
// Vercel Blob as `backups/<YYYY-MM-DD>/<HHMMSS>-<collection>.json.enc`.
//
// Design notes:
// - Fails closed: without BACKUP_ENCRYPTION_KEY it refuses to write, because
//   Blob URLs are public and these files contain customer PII.
// - Caps each collection at MAX_DOCS_PER_COLLECTION so one run cannot blow the
//   function's memory. When the cap is hit the manifest records `truncated`
//   and an alert fires — a silently partial backup would be worse than a loud one.
// - Keeps KEEP_DAYS of daily folders, pruning older blobs.

const { put, list, del } = require('@vercel/blob');
const { getDb, FieldPath } = require('../lib/http.cjs');
const ops = require('../lib/ops.cjs');

const COLLECTIONS = ['products', 'orders', 'users', 'vendors', 'reviews', 'coupons', 'utrs'];
const PAGE_SIZE = 400;
const MAX_DOCS_PER_COLLECTION = 5_000;
const KEEP_DAYS = 14;

async function exportCollection(db, name) {
  const docs = [];
  let last = null;
  let truncated = false;

  for (;;) {
    let query = db
      .collection(name)
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (last) query = query.startAfter(last);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    snapshot.forEach((doc) => {
      docs.push({ id: doc.id, data: ops.encodeValue(doc.data()) });
    });

    last = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < PAGE_SIZE) break;
    if (docs.length >= MAX_DOCS_PER_COLLECTION) {
      truncated = true;
      break;
    }
  }

  return { docs, truncated };
}

async function writeBackup(pathname, payload, key, token) {
  const encrypted = ops.encryptBuffer(Buffer.from(payload, 'utf8'), key);
  await put(pathname, encrypted, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/octet-stream',
    token,
  });
  return encrypted.length;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!ops.authorizeCron(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const key = ops.deriveBackupKey();
  if (!token || !key) {
    const missing = [!token && 'BLOB_READ_WRITE_TOKEN', !key && 'BACKUP_ENCRYPTION_KEY']
      .filter(Boolean)
      .join(', ');
    await ops.notifyOps({
      level: 'error',
      source: 'backup',
      title: 'Backup is not configured',
      detail: `Missing ${missing}. No backup was written.`,
    });
    return res.status(503).json({ error: `Backup is not configured (missing ${missing}).` });
  }

  const startedAt = new Date();
  const summaries = [];

  try {
    const db = getDb();

    for (const collection of COLLECTIONS) {
      const { docs, truncated } = await exportCollection(db, collection);
      const body = JSON.stringify({
        collection,
        exportedAt: startedAt.toISOString(),
        count: docs.length,
        truncated,
        docs,
      });
      const pathname = ops.backupPathFor(startedAt, collection);
      const bytes = await writeBackup(pathname, body, key, token);

      summaries.push({
        collection,
        docs: docs.length,
        bytes,
        truncated,
        pathname,
        sha256: ops.sha256(body),
      });
    }

    const manifest = {
      project: process.env.FIREBASE_PROJECT_ID || 'speedersmania-aecd2',
      createdAt: startedAt.toISOString(),
      collections: summaries,
    };
    const manifestPath = ops.backupManifestPathFor(startedAt);
    const manifestBytes = await writeBackup(manifestPath, JSON.stringify(manifest), key, token);

    // Prune old days. A failure here must not fail the backup itself.
    let pruned = 0;
    try {
      const existing = await list({ prefix: 'backups/', limit: 1_000, token });
      const stale = ops.chooseBackupsToDelete(
        existing.blobs.map((blob) => blob.pathname),
        { keepDays: KEEP_DAYS }
      );
      const urls = existing.blobs
        .filter((blob) => stale.includes(blob.pathname))
        .map((blob) => blob.url);
      if (urls.length) {
        await del(urls, { token });
        pruned = urls.length;
      }
    } catch (err) {
      console.error('[backup] pruning failed:', err?.message);
    }

    const truncatedCollections = summaries.filter((s) => s.truncated).map((s) => s.collection);
    if (truncatedCollections.length) {
      await ops.notifyOps({
        level: 'warn',
        source: 'backup',
        title: 'Backup is truncated',
        detail:
          `${truncatedCollections.join(', ')} exceeded ${MAX_DOCS_PER_COLLECTION} documents. ` +
          'Older/newer documents beyond the cap were not saved — raise the cap or split the export.',
      });
    }

    return res.status(200).json({
      ok: true,
      createdAt: startedAt.toISOString(),
      manifest: manifestPath,
      manifestBytes,
      pruned,
      truncatedCollections,
      collections: summaries.map(({ collection, docs, bytes, sha256 }) => ({
        collection,
        docs,
        bytes,
        sha256,
      })),
    });
  } catch (err) {
    console.error('[backup] failed:', err?.message);
    await ops.notifyOps({
      level: 'error',
      source: 'backup',
      title: 'Firestore backup failed',
      detail: ops.summarizeError(err),
    });
    return res.status(500).json({ error: 'Backup failed. Check the logs and the alert channel.' });
  }
};
