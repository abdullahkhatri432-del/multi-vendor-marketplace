// Shared helpers for the Vercel serverless functions in /api.
// CommonJS so it can be required by the api/*.js handlers (api/package.json
// sets "type": "commonjs").

const axios = require('axios');
const dns = require('dns');
const net = require('net');
const admin = require('firebase-admin');

// FieldValue must come from the same firebase-admin instance that owns `db`.
// When Vercel installs per-function dependencies (api/package.json) alongside
// the root ones, two copies of the SDK can coexist; a transform created by one
// copy fails `instanceof` checks in the other and Firestore refuses to
// serialize it ("ServerTimestampTransform ... custom prototypes"). Exporting it
// from this module keeps transforms and the Firestore client in sync.
const FieldValue = admin.firestore.FieldValue;

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------- Firebase --
function getDb() {
  if (!admin.apps || !admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (raw) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(raw);
      } catch (err) {
        throw new HttpError(500, 'FIREBASE_SERVICE_ACCOUNT is not valid JSON');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else {
      // Application default credentials (Vercel/Google Cloud runtime).
      admin.initializeApp();
    }
  }
  return admin.firestore();
}

// Verify a Firebase ID token sent as `Authorization: Bearer <token>`.
// Returns the decoded token (uid, email, name) or throws a 401.
async function authenticate(req) {
  // Ensure Firebase Admin is initialised (cold starts on Vercel).
  getDb();
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    throw new HttpError(401, 'Sign in required');
  }
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (err) {
    throw new HttpError(401, 'Your session has expired. Please sign in again.');
  }
}

// -------------------------------------------------------------------- CORS --
function allowedOrigins() {
  const configured = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Ignore the browser Origin header entirely unless it is explicitly allowed.
  if (configured.length) return configured;

  // Sensible local defaults when no allow-list is configured (development).
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    return [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ];
  }
  return [];
}

function applyCors(req, res) {
  const origin = req.headers?.origin;
  if (!origin) return;
  if (allowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

// ----------------------------------------------------------- Rate limiting --
// Per-instance in-memory limiter. Good enough to blunt accidental loops and
// casual abuse; use a shared store (Redis/KV) if you need strict global limits.
const buckets = new Map();

function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function rateLimit(req, { limit = 30, windowMs = 60_000, scope = 'default' } = {}) {
  const now = Date.now();
  const key = `${scope}:${clientIp(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new HttpError(429, 'Too many requests. Please wait a minute and try again.');
  }
}

// -------------------------------------------------------------------- SSRF --
const BLOCKED_HOST_SUFFIXES = [
  'localhost',
  'local',
  'internal',
  'intranet',
  'lan',
  'home.arpa',
  'metadata.google.internal',
];

function ipv4ToInt(ip) {
  return ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function isPrivateIpv4(ip) {
  const value = ipv4ToInt(ip);
  const block = (cidr, bits) => {
    const base = ipv4ToInt(cidr);
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (base & mask);
  };
  return (
    block('0.0.0.0', 8) ||
    block('10.0.0.0', 8) ||
    block('100.64.0.0', 10) ||
    block('127.0.0.0', 8) ||
    block('169.254.0.0', 16) ||
    block('172.16.0.0', 12) ||
    block('192.0.0.0', 24) ||
    block('192.0.2.0', 24) ||
    block('192.168.0.0', 16) ||
    block('198.18.0.0', 15) ||
    block('198.51.100.0', 24) ||
    block('203.0.113.0', 24) ||
    block('224.0.0.0', 4) ||
    block('240.0.0.0', 4)
  );
}

function isPrivateIpv6(ip) {
  const normalized = ip.toLowerCase().split('%')[0];
  // IPv4-mapped (::ffff:127.0.0.1) and NAT64.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8')
  );
}

function isPrivateAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true; // unknown -> treat as unsafe
}

function assertPublicHttpUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl).trim());
  } catch {
    throw new HttpError(400, 'Please enter a valid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new HttpError(400, 'Only http:// and https:// URLs are supported.');
  }
  if (url.username || url.password) {
    throw new HttpError(400, 'URLs with embedded credentials are not supported.');
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new HttpError(400, 'Only standard web ports (80/443) are allowed.');
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost' || BLOCKED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`))) {
    throw new HttpError(400, 'This URL is not allowed.');
  }
  if (!host.includes('.') && net.isIP(host) === 0) {
    throw new HttpError(400, 'This URL is not allowed.');
  }
  if (net.isIP(host) !== 0 && isPrivateAddress(host)) {
    throw new HttpError(400, 'This URL is not allowed.');
  }
  return url;
}

// Custom DNS lookup so every connection (including redirects) is checked
// against private address ranges, defeating DNS-rebinding tricks.
function safeLookup(hostname, options, callback) {
  const opts = typeof options === 'object' && options !== null ? options : {};

  dns.lookup(hostname, { ...opts, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = Array.isArray(addresses) ? addresses : [addresses];
    if (!list.length) return callback(new Error('Could not resolve host'));
    for (const entry of list) {
      if (isPrivateAddress(entry.address)) {
        return callback(new Error('Blocked: private network address'));
      }
    }
    if (opts.all) return callback(null, list);
    return callback(null, list[0].address, list[0].family);
  });
}

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

// Fetch an HTML page from a public URL with SSRF protections and size limits.
async function fetchHtml(rawUrl, { timeout = 15_000 } = {}) {
  let url = assertPublicHttpUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let response;
    try {
      response = await axios.get(url.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
        },
        timeout,
        maxRedirects: 0,
        maxContentLength: MAX_HTML_BYTES,
        maxBodyLength: MAX_HTML_BYTES,
        responseType: 'text',
        lookup: safeLookup,
        validateStatus: (status) => status >= 200 && status < 400,
      });
    } catch (err) {
      if (err.code === 'ECONNABORTED') throw new HttpError(408, 'The URL took too long to respond.');
      if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
        throw new HttpError(400, 'Could not resolve that URL.');
      }
      const status = err.response?.status;
      if (status === 404) throw new HttpError(404, 'The URL returned a 404.');
      if (status === 401 || status === 403) throw new HttpError(403, 'The site blocked the request.');
      if (/private network/i.test(err.message || '')) {
        throw new HttpError(400, 'This URL is not allowed.');
      }
      throw new HttpError(502, 'Could not fetch that page.');
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location) throw new HttpError(502, 'The site returned an invalid redirect.');
      url = assertPublicHttpUrl(new URL(location, url).toString());
      continue;
    }

    const contentType = String(response.headers['content-type'] || '');
    if (contentType && !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
      throw new HttpError(415, 'That URL did not return an HTML page.');
    }
    if (typeof response.data !== 'string' || response.data.length === 0) {
      throw new HttpError(422, 'That page returned no usable content.');
    }
    return response.data;
  }

  throw new HttpError(400, 'Too many redirects.');
}

module.exports = {
  HttpError,
  getDb,
  authenticate,
  applyCors,
  rateLimit,
  assertPublicHttpUrl,
  fetchHtml,
  isPrivateAddress,
  FieldValue,
  adminModulePath: require.resolve('firebase-admin'),
};
