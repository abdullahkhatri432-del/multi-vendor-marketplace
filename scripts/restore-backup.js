/**
 * Restore a Speedersmania backup produced by /api/backup.
 *
 * SAFE BY DEFAULT: it prints what it would do and writes nothing unless you
 * pass --write. Restores merge into existing documents so a partial restore
 * cannot silently wipe fields the backup does not contain.
 *
 * Usage:
 *   npm run restore -- --from ./backups/2026-11-01/183000-manifest.json.enc --list
 *   npm run restore -- --from https://.../orders.json.enc --only orders
 *   npm run restore -- --from ./orders.json.enc --only orders --write
 *
 * Flags:
 *   --from <path|url>   Backup file (.json.enc). Required.
 *   --only <name>       Restrict to one collection (orders, products, users, ...)
 *   --write             Actually write. Without it this is a dry run.
 *   --replace           Overwrite documents instead of merging fields.
 *   --list              Only print the collection summary, never write.
 *
 * Credentials: FIREBASE_SERVICE_ACCOUNT (JSON string) is read from the
 * environment or .env. BACKUP_ENCRYPTION_KEY must match the key used to
 * create the backup.
 */
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

dotenv.config();

const require = createRequire(import.meta.url);
const ops = require('../lib/ops.cjs');

const BATCH_SIZE = 400;

function parseArgs(argv) {
  const args = { from: null, only: null, write: false, replace: false, list: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--from':
        args.from = argv[++i];
        break;
      case '--only':
        args.only = argv[++i];
        break;
      case '--write':
        args.write = true;
        break;
      case '--replace':
        args.replace = true;
        break;
      case '--list':
        args.list = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          throw new Error(`Unknown flag: ${arg}`);
        }
    }
  }
  return args;
}

function usage() {
  console.log(`Restore a Speedersmania backup (dry run unless --write).

  --from <path|url>   Backup file (.json.enc) — required
  --only <name>       Restore a single collection
  --write             Perform the writes
  --replace           Replace documents instead of merging fields
  --list              Print the summary only

Example:
  npm run restore -- --from ./backups/2026-11-01/183000-orders.json.enc --list
`);
}

async function loadBackup(source) {
  const payload = /^https?:\/\//i.test(source)
    ? Buffer.from(await (await fetch(source)).arrayBuffer())
    : readFileSync(source);

  const key = ops.deriveBackupKey();
  if (!key) {
    throw new Error('BACKUP_ENCRYPTION_KEY is not set — cannot decrypt this backup.');
  }
  const plaintext = ops.decryptBuffer(payload, key);
  const parsed = JSON.parse(plaintext.toString('utf8'));

  // Both a single collection file and a manifest are accepted.
  if (Array.isArray(parsed.docs)) {
    return { collections: [{ collection: parsed.collection, docs: parsed.docs }], manifest: null };
  }
  return { collections: null, manifest: parsed };
}

async function fetchCollectionDocs(source, collectionName) {
  const directory = source.slice(0, source.lastIndexOf('/'));
  const fileName = source.slice(source.lastIndexOf('/') + 1);
  // 183000-orders.json.enc -> 183000-<collection>.json.enc
  const target = fileName.replace(/-[a-z]+\.json\.enc$/, `-${collectionName}.json.enc`);
  const url = `${directory}/${target}`;

  for (const candidate of [url, source]) {
    try {
      const payload = /^https?:\/\//i.test(candidate)
        ? Buffer.from(await (await fetch(candidate)).arrayBuffer())
        : readFileSync(candidate);
      const plaintext = ops.decryptBuffer(payload, ops.deriveBackupKey());
      const parsed = JSON.parse(plaintext.toString('utf8'));
      if (Array.isArray(parsed.docs)) return parsed;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.from) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  let db;
  const connect = () => {
    if (db) return db;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set (see .env.example).');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    db = admin.firestore();
    return db;
  };

  const loaded = await loadBackup(args.from);

  const plan = [];
  if (loaded.manifest) {
    for (const entry of loaded.manifest.collections || []) {
      plan.push({ collection: entry.collection, docs: entry.docs, truncated: entry.truncated });
    }
  } else {
    for (const entry of loaded.collections) {
      plan.push({ collection: entry.collection, docs: entry.docs, truncated: false });
    }
  }

  const selected = args.only ? plan.filter((entry) => entry.collection === args.only) : plan;

  console.log(args.write ? 'MODE: write' : 'MODE: dry run (pass --write to apply)');
  console.log(`Source: ${args.from}`);
  if (args.replace) console.log('Documents will be replaced, not merged.');

  for (const entry of selected) {
    if (!entry.docs) {
      // Manifest-only mode: fetch the collection file that sits next to it.
      const fetched = await fetchCollectionDocs(args.from, entry.collection);
      if (!fetched) {
        console.log(`  ${entry.collection}: SKIPPED (collection file not found next to the source)`);
        continue;
      }
      entry.docs = fetched.docs;
      entry.truncated = fetched.truncated;
    }

    const label = `${entry.collection.padEnd(10)} ${String(entry.docs.length).padStart(6)} docs`;
    if (!args.write) {
      const sample = entry.docs[0]?.id ? ` (e.g. ${entry.docs[0].id})` : '';
      console.log(`  ${label}${sample}${entry.truncated ? '  [truncated backup]' : ''}`);
      continue;
    }

    const database = connect();
    let written = 0;
    for (let i = 0; i < entry.docs.length; i += BATCH_SIZE) {
      const slice = entry.docs.slice(i, i + BATCH_SIZE);
      const batch = database.batch();
      for (const doc of slice) {
        if (!doc?.id) continue;
        const ref = database.collection(entry.collection).doc(doc.id);
        const data = ops.decodeValue(doc.data, database);
        batch.set(ref, data, { merge: !args.replace });
      }
      await batch.commit();
      written += slice.length;
    }
    console.log(`  ${label} -> wrote ${written}${entry.truncated ? '  [truncated backup]' : ''}`);
  }

  if (!args.write) {
    console.log('\nNothing was written. Re-run with --write to apply this plan.');
  }
}

main().catch((err) => {
  console.error('Restore failed:', err.message);
  process.exit(1);
});
