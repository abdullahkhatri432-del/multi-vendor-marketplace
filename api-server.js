// Local development API server.
//
// Mirrors the Vercel serverless functions in /api so the exact same handlers
// run locally. Start with `npm run dev` (runs Vite + this server together).
import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const { getDb, applyCors } = require('./lib/http.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Fail fast on startup if Firebase credentials are missing/shape-invalid.
let db;
try {
  db = getDb();
} catch (err) {
  console.error('[api-server] Firebase Admin initialization failed:', err.message);
  console.error('[api-server] Set FIREBASE_SERVICE_ACCOUNT in .env (see .env.example).');
  process.exit(1);
}

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || db.projectId || 'unknown';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// CORS: allow the configured origins (defaults cover local Vite ports).
// Requests proxied through Vite are same-origin and don't need this.
app.use(cors({ origin: true, credentials: false }));

// Basic security headers for API responses.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const importProductHandler = require('./api/import-product.js');
const bulkImportHandler = require('./api/bulk-import.js');
const createOrderHandler = require('./api/create-order.js');
const healthHandler = require('./api/health.js');

app.get('/api/health', healthHandler);
app.post('/api/import-product', importProductHandler);
app.post('/api/bulk-import', bulkImportHandler);
app.post('/api/create-order', createOrderHandler);

// Handle preflight for any API route (Express 5 no longer accepts '/api/*').
app.use((req, res, next) => {
  if (req.method === 'OPTIONS' && req.path.startsWith('/api/')) {
    applyCors(req, res);
    return res.status(204).end();
  }
  next();
});

// JSON 404 (last).
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Central error handler: never leak stack traces.
app.use((err, req, res, next) => {
  console.error('[api-server] Unhandled error:', err?.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.status && err.status < 500 ? err.message : 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`[api-server] Listening on http://localhost:${PORT} (project: ${PROJECT_ID})`);
});
