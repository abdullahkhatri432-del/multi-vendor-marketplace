// Daily operations check, triggered by the Vercel cron in vercel.json.
//
// Two questions, asked once a day:
//   1. Is the public API healthy right now?     (GET $SITE_URL/api/health)
//   2. Is the backup fresh?                     (newest blob under backups/)
//
// A cron on the same platform cannot report a full platform outage — if Vercel
// is down, this job never runs. Point an external uptime monitor at
// /api/health as well; docs/OPERATIONS.md explains the split of duties.

const { list } = require('@vercel/blob');
const ops = require('../lib/ops.cjs');

const HEALTH_TIMEOUT_MS = 8_000;
const BACKUP_STALE_HOURS = 36;
const DEFAULT_SITE_URL = 'https://speedersmania.vercel.app';

function siteUrl() {
  return String(process.env.SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

async function checkHealth(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/api/health`, {
      headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'speedersmania-cron/1.0' },
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    return {
      ok: response.ok && body.status === 'ok',
      statusCode: response.status,
      body,
    };
  } catch (err) {
    return { ok: false, statusCode: 0, error: ops.summarizeError(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function checkBackupAge(now = Date.now()) {
  // Same auth rules as api/backup.js: static token, or OIDC via BLOB_STORE_ID.
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;
  if (!token && !storeId) {
    return { configured: false, ok: false, reason: 'No Blob store is connected (BLOB_STORE_ID/BLOB_READ_WRITE_TOKEN missing)' };
  }
  const auth = token ? { token } : {};

  const { blobs } = await list({ prefix: 'backups/', limit: 1_000, ...auth });
  const manifests = blobs.filter((blob) => blob.pathname.endsWith('-manifest.json.enc'));
  if (!manifests.length) {
    return { configured: true, ok: false, reason: 'No backup manifest found' };
  }

  const newest = manifests.reduce((latest, blob) =>
    new Date(blob.uploadedAt).getTime() > new Date(latest.uploadedAt).getTime() ? blob : latest
  );
  const ageHours = (now - new Date(newest.uploadedAt).getTime()) / 3_600_000;
  return {
    configured: true,
    ok: ageHours <= BACKUP_STALE_HOURS,
    pathname: newest.pathname,
    uploadedAt: newest.uploadedAt,
    ageHours: Math.round(ageHours * 10) / 10,
    reason: ageHours > BACKUP_STALE_HOURS ? `Newest backup is ${ageHours.toFixed(1)}h old` : null,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!ops.authorizeCron(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const health = await checkHealth(siteUrl());

  let backup;
  try {
    backup = await checkBackupAge();
  } catch (err) {
    backup = { configured: true, ok: false, reason: ops.summarizeError(err) };
  }

  const problems = [];
  if (!health.ok) {
    problems.push(
      health.statusCode
        ? `API health returned HTTP ${health.statusCode}${health.body?.status ? ` (${health.body.status})` : ''}`
        : `API health check failed: ${health.error}`
    );
  }
  if (!backup.ok) problems.push(backup.reason || 'Backup check failed');

  if (problems.length) {
    await ops.notifyOps({
      level: health.ok ? 'warn' : 'error',
      source: 'cron-health',
      title: health.ok ? 'Daily check: backup problem' : 'Daily check: site is unhealthy',
      detail: problems.join('; '),
    });
  }

  const payload = {
    ok: problems.length === 0,
    checkedAt: new Date().toISOString(),
    site: siteUrl(),
    health,
    backup,
  };

  return res.status(problems.length ? 503 : 200).json(payload);
};
