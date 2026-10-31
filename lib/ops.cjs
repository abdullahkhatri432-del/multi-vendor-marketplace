// Operations helpers shared by the cron endpoints in /api.
//
// Deliberately free of firebase-admin so the test suite can exercise every
// branch without credentials. Three concerns live here:
//
//   1. Alerting  — every configured channel (Telegram, plus an optional
//                  Slack/Discord/generic webhook) for server errors.
//   2. Backups   — AES-256-GCM envelope so a backup file is useless without
//                  BACKUP_ENCRYPTION_KEY, even though Blob URLs are public.
//   3. Utilities — Firestore value <-> JSON, cron auth, retention selection.

const crypto = require('crypto');

// ------------------------------------------------------------------ alerts --

const ALERT_TIMEOUT_MS = 4_000;
const MAX_DETAIL_CHARS = 1_500;
const ALERT_DEDUPE_MS = 5 * 60_000;

const LEVEL_PREFIX = {
  error: '🚨',
  warn: '⚠️',
  info: 'ℹ️',
};

function alertWebhookUrl() {
  return String(process.env.ALERT_WEBHOOK_URL || '').trim();
}

// Slack and Discord disagree about the payload key, and both reject some of
// the fields the other expects, so the channel decides the shape.
function alertChannel(url) {
  const raw = String(url || '').toLowerCase();
  if (raw.includes('discord.com/api/webhooks') || raw.includes('discordapp.com/api/webhooks')) {
    return 'discord';
  }
  if (raw.includes('hooks.slack.com')) return 'slack';
  return 'generic';
}

function clip(value, max = MAX_DETAIL_CHARS) {
  const text = typeof value === 'string' ? value : String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildAlertPayload(url, alert = {}) {
  const level = LEVEL_PREFIX[alert.level] ? alert.level : 'error';
  const title = clip(alert.title || 'Speedersmania alert', 200);
  const detail = clip(alert.detail || '');
  const source = clip(alert.source || 'api', 60);
  const at = alert.at instanceof Date ? alert.at : new Date(alert.at || Date.now());
  const prefix = LEVEL_PREFIX[level];
  const body = detail ? `${source}: ${detail}` : source;

  switch (alertChannel(url)) {
    case 'discord':
      return { content: `${prefix} **${title}**\n${clip(body, 1_800)}` };
    case 'slack':
      return { text: `${prefix} *${title}*\n${body}` };
    default:
      return {
        level,
        title,
        detail,
        source,
        at: at.toISOString(),
        text: `${prefix} ${title} — ${body}`,
      };
  }
}

// Serverless instances are short-lived, so this only guards against a burst of
// identical failures inside one warm instance. Enough to avoid a webhook storm
// when a dependency is down and every request fails the same way.
const recentlySent = new Map();

function shouldSendAlert(key, now = Date.now(), windowMs = ALERT_DEDUPE_MS) {
  const last = recentlySent.get(key);
  if (last && now - last < windowMs) return false;
  recentlySent.set(key, now);
  if (recentlySent.size > 200) {
    for (const [k, ts] of recentlySent) {
      if (now - ts >= windowMs) recentlySent.delete(k);
    }
  }
  return true;
}

function resetAlertDedupe() {
  recentlySent.clear();
}

// ------------------------------------------------------------- telegram --
// Telegram is the recommended channel: it reaches a phone without another
// account, and a bot is two values (token + chat id) that can be revoked at
// any time from @BotFather.

const TELEGRAM_API = 'https://api.telegram.org';

function telegramEndpoint(token) {
  return `${TELEGRAM_API}/bot${String(token).trim()}/sendMessage`;
}

// Deliberately plain text (no parse_mode): Telegram's MarkdownV2 requires
// escaping ~20 characters, and an unescaped stack trace would make the API
// return 400 — i.e. the alert about the outage would be the thing that fails.
function buildTelegramPayload(chatId, alert = {}) {
  const level = LEVEL_PREFIX[alert.level] ? alert.level : 'error';
  const title = clip(alert.title || 'Speedersmania alert', 200);
  const detail = clip(alert.detail || '', 1_200);
  const source = clip(alert.source || 'api', 60);
  const at = alert.at instanceof Date ? alert.at : new Date(alert.at || Date.now());

  const lines = [`${LEVEL_PREFIX[level]} ${title}`, detail ? `${source}: ${detail}` : source];
  return {
    chat_id: String(chatId).trim(),
    text: `${lines.join('\n')}\n${at.toISOString()}`,
    disable_web_page_preview: true,
  };
}

// Every configured channel gets the alert. Telegram and the generic webhook are
// independent, so setting both gives a second path if one is misconfigured.
function alertTargets(env = process.env) {
  const targets = [];

  const token = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = String(env.TELEGRAM_CHAT_ID || '').trim();
  if (token && chatId) targets.push({ kind: 'telegram', token, chatId });

  const url = String(env.ALERT_WEBHOOK_URL || '').trim();
  if (url) targets.push({ kind: 'webhook', url });

  return targets;
}

async function sendAlert(target, alert, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ALERT_TIMEOUT_MS);
  try {
    const isTelegram = target.kind === 'telegram';
    const response = await fetchImpl(
      isTelegram ? telegramEndpoint(target.token) : target.url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isTelegram
            ? buildTelegramPayload(target.chatId, alert)
            : buildAlertPayload(target.url, alert)
        ),
        signal: controller.signal,
      }
    );
    return Boolean(response?.ok);
  } catch (err) {
    console.error(`[ops] ${target.kind} alert delivery failed:`, err?.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Resolves to true when at least one channel accepted the alert. Never throws:
// an error path must not fail because the notifier is down.
async function notifyOps(alert, options = {}) {
  const targets = options.targets
    || (options.url ? [{ kind: 'webhook', url: options.url }] : alertTargets());
  if (!targets.length) return false;

  const key = `${alert?.source || 'api'}:${alert?.title || ''}:${alert?.level || 'error'}`;
  if (!options.skipDedupe && !shouldSendAlert(key, options.now || Date.now())) return false;

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') return false;

  const results = await Promise.allSettled(
    targets.map((target) => sendAlert(target, alert, fetchImpl))
  );
  return results.some((result) => result.status === 'fulfilled' && result.value === true);
}

// ------------------------------------------------------------ encryption --
// Envelope: magic(4) | iv(12) | authTag(16) | ciphertext
// AES-256-GCM because backups contain customer names, addresses and phones.

const MAGIC = Buffer.from('SMBK');
const IV_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = MAGIC.length + IV_BYTES + TAG_BYTES;

// Accepts a 64-char hex key (generate with `openssl rand -hex 32`) or any
// passphrase, which is stretched with scrypt. Returns null when unset so
// callers can fail closed instead of writing unencrypted backups.
function deriveBackupKey(raw = process.env.BACKUP_ENCRYPTION_KEY) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  if (/^[0-9a-fA-F]{64}$/.test(value)) return Buffer.from(value, 'hex');
  return crypto.scryptSync(value, 'speedersmania-backup-v1', 32);
}

function encryptBuffer(buffer, key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error('Backup encryption key must be 32 bytes');
  }
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(buffer)), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), ciphertext]);
}

function decryptBuffer(payload, key) {
  const buffer = Buffer.from(payload);
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error('Backup encryption key must be 32 bytes');
  }
  if (buffer.length <= HEADER_BYTES) throw new Error('Backup file is truncated or empty');
  if (!buffer.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('Not a Speedersmania backup file (bad header)');
  }
  const iv = buffer.subarray(MAGIC.length, MAGIC.length + IV_BYTES);
  const tag = buffer.subarray(MAGIC.length + IV_BYTES, HEADER_BYTES);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(buffer.subarray(HEADER_BYTES)), decipher.final()]);
}

// ------------------------------------------------------- value encoding ----
// Firestore values do not survive JSON.stringify intact (Timestamp becomes
// {_seconds,_nanoseconds}, DocumentReference becomes {}), so tag them.

const TYPE_KEY = '__smType';

function encodeValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return { [TYPE_KEY]: 'date', value: value.toISOString() };
  if (Buffer.isBuffer(value)) return { [TYPE_KEY]: 'bytes', base64: value.toString('base64') };
  if (typeof value.toDate === 'function' && typeof value.seconds === 'number') {
    return { [TYPE_KEY]: 'timestamp', value: value.toDate().toISOString() };
  }
  if (typeof value.path === 'string' && value.firestore && typeof value.firestore.doc === 'function') {
    return { [TYPE_KEY]: 'ref', path: value.path };
  }
  if (typeof value.latitude === 'number' && typeof value.longitude === 'number') {
    return { [TYPE_KEY]: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  }
  if (Array.isArray(value)) return value.map(encodeValue);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) out[key] = encodeValue(nested);
    return out;
  }
  return value;
}

// `db` is only needed to rebuild DocumentReference values on restore.
function decodeValue(value, db) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => decodeValue(item, db));
  const tag = value[TYPE_KEY];
  if (tag) {
    switch (tag) {
      case 'date':
      case 'timestamp':
        return new Date(value.value);
      case 'bytes':
        return Buffer.from(value.base64, 'base64');
      case 'ref':
        return db && typeof db.doc === 'function' ? db.doc(value.path) : value.path;
      case 'geopoint': {
        const GeoPoint = db && db.GeoPoint;
        return typeof GeoPoint === 'function'
          ? new GeoPoint(value.latitude, value.longitude)
          : { latitude: value.latitude, longitude: value.longitude };
      }
      default:
        return value;
    }
  }
  const out = {};
  for (const [key, nested] of Object.entries(value)) out[key] = decodeValue(nested, db);
  return out;
}

// ------------------------------------------------------- backup paths ------

function dateFolder(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

function timeFolder(date = new Date()) {
  return new Date(date).toISOString().slice(11, 19).replace(/:/g, '');
}

function backupPathFor(date, collection) {
  return `backups/${dateFolder(date)}/${timeFolder(date)}-${collection}.json.enc`;
}

function backupManifestPathFor(date) {
  return `backups/${dateFolder(date)}/${timeFolder(date)}-manifest.json.enc`;
}

// Keep the newest `keepDays` daily folders; return everything older.
function chooseBackupsToDelete(pathnames = [], { keepDays = 14 } = {}) {
  const folders = [...new Set(
    pathnames
      .map((pathname) => String(pathname).split('/'))
      .filter((parts) => parts[0] === 'backups' && parts.length > 2)
      .map((parts) => parts[1])
  )].sort().reverse();

  const expired = new Set(folders.slice(Math.max(keepDays, 0)));
  return pathnames.filter((pathname) => {
    const parts = String(pathname).split('/');
    return parts[0] === 'backups' && expired.has(parts[1]);
  });
}

// ------------------------------------------------------------ cron auth ----

function authorizeCron(req, secret = process.env.CRON_SECRET) {
  const expected = String(secret || '').trim();
  if (!expected) return false;
  const header = String(req?.headers?.authorization || req?.headers?.Authorization || '');
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const provided = Buffer.from(match[1].trim());
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length) return false;
  return crypto.timingSafeEqual(provided, wanted);
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function sha256(input) {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.from(input);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Error text that is safe to put in an alert: message plus code, no stack.
function summarizeError(err, max = 800) {
  if (!err) return 'Unknown error';
  const code = err.code || err.name;
  const message = err.message || String(err);
  return clip(code && !String(message).includes(String(code)) ? `${code}: ${message}` : message, max);
}

module.exports = {
  alertWebhookUrl,
  alertChannel,
  alertTargets,
  buildAlertPayload,
  buildTelegramPayload,
  telegramEndpoint,
  notifyOps,
  shouldSendAlert,
  resetAlertDedupe,
  MAGIC,
  deriveBackupKey,
  encryptBuffer,
  decryptBuffer,
  encodeValue,
  decodeValue,
  backupPathFor,
  backupManifestPathFor,
  chooseBackupsToDelete,
  authorizeCron,
  formatBytes,
  sha256,
  summarizeError,
  dateFolder,
  timeFolder,
};
