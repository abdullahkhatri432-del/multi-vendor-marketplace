import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Default markup percentage for wholesalers (can be overridden per vendor)
const DEFAULT_MARKUP_PERCENTAGE = 20; // 20% markup

// Initialize Firebase Admin SDK
if (!admin.apps || !admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log('[Firebase Admin] Initialized with service account for project:', serviceAccount.project_id);
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('[Firebase Admin] Initialized with application default credentials');
  }
} else {
  console.log('[Firebase Admin] Already initialized');
}

// Wait for app to be fully initialized
await new Promise(resolve => setTimeout(resolve, 100));

// Get the app instance
const appInstance = admin.apps[0] || admin.apps.length > 0 ? admin.apps[0] : null;
console.log('[Firebase Admin] App instance:', appInstance ? 'exists' : 'null');
console.log('[Firebase Admin] App project ID:', appInstance?.options?.projectId || 'unknown');

const db = admin.firestore(appInstance);
console.log('[Firebase Admin] Firestore instance created');
console.log('[Firebase Admin] Firestore project ID:', db.projectId);
console.log('[Firebase Admin] Firestore database ID:', db.databaseId);

// Test Firestore connection immediately
db.collection('health_check').doc('test').set({ test: true, timestamp: Date.now() })
  .then(() => console.log('[Firebase Admin] Initial Firestore test: WRITE OK'))
  .catch(err => console.error('[Firebase Admin] Initial Firestore test FAILED:', err.message, err.code));
  
// Wait a bit for Firestore to be fully ready
await new Promise(resolve => setTimeout(resolve, 500));
  
const PROJECT_ID = 'speedersmania-aecd2';

// Global request logging middleware (FIRST)
app.use((req, res, next) => {
  console.log('[Global] >>>', req.method, req.url, req.path);
  next();
});

// Middleware (BEFORE routes)
app.use(cors());
app.use(express.json());

// Routes (BEFORE 404 handler)
app.get('/api/test', (req, res) => {
    console.log('[Test Route] >>> HIT:', req.method, req.url, req.path);
    res.json({ status: 'ok', message: 'Test route works' });
});
console.log('[Setup] Test route registered at /api/test at', new Date().toISOString());

app.get('/api/health', async (req, res) => {
    console.log('>>> HEALTH CHECK HANDLER START <<<');
    console.log('[Health Check] >>> REQUEST RECEIVED:', req.method, req.url);
    console.log('[Health Check] db:', !!db, db?.projectId, db?.databaseId);
    try {
        console.log('[Health Check] Testing Firestore connection...');
        console.log('[Health Check] Project ID:', PROJECT_ID);
        
        // Test Firestore write
        const testRef = db.collection('health_check').doc('test');
        console.log('[Health Check] Writing test document...');
        await testRef.set({ timestamp: Date.now(), test: true });
        console.log('[Health Check] Write successful, reading back...');
        const snapshot = await testRef.get();
        console.log('[Health Check] Read successful, exists:', snapshot.exists);
        await testRef.delete();
        console.log('[Health Check] Delete successful');
        res.json({ status: 'ok', firestore: 'connected', project: PROJECT_ID });
    } catch (error) {
        console.error('[Health Check] Firestore connection failed - FULL ERROR:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.error('[Health Check] Error message:', error.message);
        console.error('[Health Check] Error code:', error.code);
        console.error('[Health Check] Error stack:', error.stack);
        
        let errorMessage = error.message;
        if (error.message && error.message.includes('Unable to detect a Project Id')) {
            errorMessage = 'Firestore database not found. Please create the Firestore database in Firebase Console: https://console.firebase.google.com/project/speedersmania-aecd2/firestore';
        }
        
        res.status(500).json({ status: 'error', firestore: 'disconnected', error: errorMessage, code: error.code });
    }
});

app.use((req, res, next) => {
  console.log('[Middleware] Request:', req.method, req.url);
  next();
});

app.use(cors());
app.use(express.json());

// 404 handler (LAST)
app.use((req, res) => {
    console.log('[404 Handler] >>>', req.method, req.url, req.path);
    res.status(404).json({ error: 'Not found', path: req.path });
});

// Routes will be added here later

app.listen(PORT, () => {
  console.log(`[api-server] Import product API listening on port ${PORT}`);
});