// Ops helpers: alert shaping, backup envelope, Firestore value encoding,
// retention and cron auth. These are the parts that silently break in
// production (a malformed Discord payload, an unreadable backup file, a pruned
// "keep" folder), so they are covered without needing Firebase credentials.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');

const ops = require(path.join(__dirname, '..', 'lib', 'ops.cjs'));

// ------------------------------------------------------------------ alerts --

test('alert payloads match the channel they are sent to', () => {
  const alert = { level: 'error', title: 'Checkout failed', detail: 'utrRef is not defined', source: 'create-order' };

  const discord = ops.buildAlertPayload('https://discord.com/api/webhooks/1/x', alert);
  assert.deepEqual(Object.keys(discord), ['content']);
  assert.match(discord.content, /Checkout failed/);
  assert.match(discord.content, /utrRef is not defined/);

  const slack = ops.buildAlertPayload('https://hooks.slack.com/services/1', alert);
  assert.deepEqual(Object.keys(slack), ['text']);

  const generic = ops.buildAlertPayload('https://example.com/hook', alert);
  assert.equal(generic.level, 'error');
  assert.equal(generic.source, 'create-order');
  assert.equal(generic.title, 'Checkout failed');
  assert.ok(generic.at);
});

test('alert detail is clipped so a stack trace cannot flood the channel', () => {
  const huge = 'x'.repeat(5000);
  const payload = ops.buildAlertPayload('https://example.com/hook', { title: 't', detail: huge });
  assert.ok(payload.detail.length <= 1500);
  assert.ok(payload.detail.endsWith('…'));
});

test('identical alerts are deduped inside the window', () => {
  ops.resetAlertDedupe();
  const key = 'create-order:Checkout failed (HTTP 500):error';
  const now = Date.now();
  assert.equal(ops.shouldSendAlert(key, now), true);
  assert.equal(ops.shouldSendAlert(key, now + 1000), false);
  assert.equal(ops.shouldSendAlert(key, now + 5 * 60_000 + 1), true);
});

test('notifyOps never throws when the webhook is down or unset', async () => {
  ops.resetAlertDedupe();
  const failing = async () => {
    throw new Error('connection refused');
  };
  assert.equal(await ops.notifyOps({ title: 'x' }, { url: 'https://example.com/hook', fetchImpl: failing }), false);
  assert.equal(await ops.notifyOps({ title: 'y' }, { url: '', fetchImpl: failing }), false);
});

test('notifyOps posts a channel-shaped body', async () => {
  ops.resetAlertDedupe();
  let captured = null;
  const fakeFetch = async (url, init) => {
    captured = { url, body: JSON.parse(init.body), method: init.method };
    return { ok: true };
  };
  const sent = await ops.notifyOps(
    { title: 'Backup failed', detail: 'quota exceeded', source: 'backup' },
    { url: 'https://discord.com/api/webhooks/1/x', fetchImpl: fakeFetch }
  );
  assert.equal(sent, true);
  assert.equal(captured.method, 'POST');
  assert.match(captured.body.content, /Backup failed/);
});

// -------------------------------------------------------------- encryption --

test('backup envelopes round-trip and hide the plaintext', () => {
  const key = crypto.randomBytes(32);
  const plaintext = Buffer.from(JSON.stringify({ orderId: 'o1', phone: '9876543210' }));
  const sealed = ops.encryptBuffer(plaintext, key);

  assert.notEqual(sealed.toString('utf8').includes('9876543210'), true);
  assert.deepEqual(ops.decryptBuffer(sealed, key), plaintext);
});

test('a tampered backup is rejected instead of restored', () => {
  const key = crypto.randomBytes(32);
  const sealed = ops.encryptBuffer(Buffer.from('{"docs":[]}'), key);
  sealed[sealed.length - 1] ^= 0xff;
  assert.throws(() => ops.decryptBuffer(sealed, key), /authenticate|unable|bad/i);
});

test('the wrong key cannot open a backup', () => {
  const sealed = ops.encryptBuffer(Buffer.from('secret'), crypto.randomBytes(32));
  assert.throws(() => ops.decryptBuffer(sealed, crypto.randomBytes(32)));
});

test('a non-backup file is rejected by the magic header', () => {
  assert.throws(() => ops.decryptBuffer(Buffer.alloc(64, 1), crypto.randomBytes(32)), /Not a Speedersmania backup/i);
});

test('backup keys accept hex and passphrases, and refuse to guess', () => {
  const hex = crypto.randomBytes(32).toString('hex');
  const fromHex = ops.deriveBackupKey(hex);
  assert.equal(fromHex.length, 32);
  assert.deepEqual(fromHex, Buffer.from(hex, 'hex'));

  const passphrase = ops.deriveBackupKey('a long passphrase');
  assert.equal(passphrase.length, 32);
  // Deterministic, so a backup made today restores tomorrow.
  assert.deepEqual(passphrase, ops.deriveBackupKey('a long passphrase'));

  assert.equal(ops.deriveBackupKey(''), null);
  assert.equal(ops.deriveBackupKey(undefined), null);
});

// ------------------------------------------------------- value encoding ----

test('Firestore timestamps, refs and bytes survive a JSON round-trip', () => {
  const timestamp = { seconds: 1_700_000_000, toDate: () => new Date('2026-10-31T12:00:00.000Z') };
  const reference = { path: 'orders/o1', firestore: { doc: () => ({}) } };
  const value = {
    orderId: 'o1',
    createdAt: timestamp,
    shippedAt: new Date('2026-11-01T09:30:00.000Z'),
    customerRef: reference,
    total: 499.5,
    tags: ['a', 'b'],
    note: null,
  };

  const encoded = ops.encodeValue(value);
  const json = JSON.parse(JSON.stringify(encoded));
  const decoded = ops.decodeValue(json);

  assert.equal(decoded.orderId, 'o1');
  assert.ok(decoded.createdAt instanceof Date);
  assert.equal(decoded.createdAt.toISOString(), '2026-10-31T12:00:00.000Z');
  assert.equal(decoded.shippedAt.toISOString(), '2026-11-01T09:30:00.000Z');
  assert.equal(decoded.customerRef, 'orders/o1'); // string path without a db handle
  assert.equal(decoded.total, 499.5);
  assert.deepEqual(decoded.tags, ['a', 'b']);
  assert.equal(decoded.note, null);
});

test('document references are rebuilt when a db handle is supplied', () => {
  const reference = { path: 'orders/o1', firestore: { doc: () => ({}) } };
  const encoded = ops.encodeValue(reference);
  assert.deepEqual(encoded, { __smType: 'ref', path: 'orders/o1' });

  const decoded = ops.decodeValue(encoded, { doc: (p) => ({ rebuilt: p }) });
  assert.deepEqual(decoded, { rebuilt: 'orders/o1' });
});

// -------------------------------------------------------------- retention --

test('retention keeps the newest day folders and deletes the rest', () => {
  const paths = [
    'backups/2026-10-20/183000-orders.json.enc',
    'backups/2026-10-25/183000-orders.json.enc',
    'backups/2026-10-31/183000-orders.json.enc',
    'backups/2026-11-01/183000-orders.json.enc',
    'backups/2026-11-01/183000-manifest.json.enc',
  ];
  const stale = ops.chooseBackupsToDelete(paths, { keepDays: 2 });
  assert.deepEqual(stale.sort(), [
    'backups/2026-10-20/183000-orders.json.enc',
    'backups/2026-10-25/183000-orders.json.enc',
  ]);
});

test('retention ignores blobs outside the backups/ prefix', () => {
  const stale = ops.chooseBackupsToDelete(['products/x.jpg', 'backups/2026-01-01/a.json.enc'], { keepDays: 1 });
  assert.deepEqual(stale, []);
});

test('backup paths group by day and carry the collection name', () => {
  const at = new Date('2026-11-01T18:30:05.000Z');
  assert.equal(ops.backupPathFor(at, 'orders'), 'backups/2026-11-01/183005-orders.json.enc');
  assert.equal(ops.backupManifestPathFor(at), 'backups/2026-11-01/183005-manifest.json.enc');
});

// ------------------------------------------------------------- cron auth --

test('cron endpoints require the exact bearer secret', () => {
  const req = (authorization) => ({ headers: authorization ? { authorization } : {} });
  assert.equal(ops.authorizeCron(req('Bearer s3cret'), 's3cret'), true);
  assert.equal(ops.authorizeCron(req('bearer s3cret'), 's3cret'), true);
  assert.equal(ops.authorizeCron(req('Bearer wrong'), 's3cret'), false);
  assert.equal(ops.authorizeCron(req('Bearer s3cret'), ''), false, 'unset secret must fail closed');
  assert.equal(ops.authorizeCron(req(undefined), 's3cret'), false);
});

test('error summaries never include stack traces', () => {
  const err = new Error('quota exceeded');
  err.code = 'RESOURCE_EXHAUSTED';
  const summary = ops.summarizeError(err);
  assert.match(summary, /quota exceeded/);
  assert.equal(summary.includes('at '), false);
});
