// Content-Security-Policy violation collector.
//
// The CSP ships in report-only mode first (see vercel.json). Because the policy
// is browser-enforced on real traffic, this endpoint is the only way to learn
// which third-party origin a checkout/login flow still needs before switching
// to enforcing mode.
//
// Browsers post either `application/csp-report` (single object under
// `csp-report`) or the newer `application/reports+json` (array). Both shapes are
// accepted. Nothing here is trusted: values are clipped, parsed defensively and
// every request is rate limited.

const { rateLimit, HttpError } = require('../lib/http.cjs');
const ops = require('../lib/ops.cjs');

const MAX_BODY_BYTES = 16 * 1024;
const MAX_STRING = 300;
const ALERTS_PER_HOUR = 8;
const HOUR_MS = 3_600_000;

let alertsThisWindow = { count: 0, resetAt: 0 };

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'Report too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function clip(value) {
  return typeof value === 'string' ? value.slice(0, MAX_STRING) : '';
}

function normalizeReport(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw || '{}');
  } catch {
    return null;
  }

  // application/reports+json -> [{ type: 'csp-violation', body: {...} }]
  const entry = Array.isArray(parsed)
    ? parsed.find((item) => item && (item.type === 'csp-violation' || item.body))
    : null;
  const report = entry?.body || parsed['csp-report'] || parsed;
  if (!report || typeof report !== 'object') return null;

  return {
    directive:
      clip(report['violated-directive'] || report.effectiveDirective || report['effective-directive']) || 'unknown',
    blocked: clip(report['blocked-uri'] || report.blockedURL || ''),
    document: clip(report['document-uri'] || report.documentURL || ''),
    source: clip(report['source-file'] || report.sourceFile || ''),
  };
}

function underAlertBudget(now = Date.now()) {
  if (now > alertsThisWindow.resetAt) {
    alertsThisWindow = { count: 0, resetAt: now + HOUR_MS };
  }
  if (alertsThisWindow.count >= ALERTS_PER_HOUR) return false;
  alertsThisWindow.count += 1;
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    rateLimit(req, { limit: 60, windowMs: 60_000, scope: 'csp-report' });
  } catch (err) {
    return res.status(err.status || 429).end();
  }

  let report = null;
  try {
    report = normalizeReport(await readBody(req));
  } catch (err) {
    return res.status(err.status || 400).end();
  }

  // Always 204: a reporting endpoint must never make the browser retry or log.
  if (!report) return res.status(204).end();

  console.warn('[csp] violation:', JSON.stringify(report));

  if (underAlertBudget()) {
    await ops.notifyOps({
      level: 'warn',
      title: `CSP violation: ${report.directive}`,
      source: 'csp',
      detail: `Blocked ${report.blocked || '(inline)'} on ${report.document || 'unknown page'}`,
    });
  }

  return res.status(204).end();
};
