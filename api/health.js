// Health check endpoint for Vercel production.
// Read-only: no writes, no secrets in the response.
const { getDb } = require('../lib/http.cjs');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  try {
    const db = getDb();
    await db.collection('products').limit(1).get();
    return res.status(200).json({
      status: 'ok',
      firestore: 'connected',
      project: process.env.FIREBASE_PROJECT_ID || 'speedersmania-aecd2',
      region: process.env.VERCEL_REGION || 'unknown',
    });
  } catch (err) {
    console.error('[api/health] Firestore check failed:', err?.message);
    return res.status(503).json({
      status: 'error',
      firestore: 'disconnected',
      error: 'Firestore is not reachable.',
    });
  }
};
