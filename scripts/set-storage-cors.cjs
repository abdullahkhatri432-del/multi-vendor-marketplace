// Sets CORS on the Firebase Storage (GCS) bucket so browser uploads work.
// Usage: node scripts/set-storage-cors.cjs
require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!serviceAccount) {
  console.error('FIREBASE_SERVICE_ACCOUNT is not set in .env');
  process.exit(1);
}

const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: serviceAccount,
});

const bucket = storage.bucket('speedersmania-aecd2.firebasestorage.app');

const corsConfig = [
  {
    origin: ['*'],
    method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
    responseHeader: [
      'Content-Type',
      'Content-Disposition',
      'Content-Length',
      'x-goog-meta-*',
      'x-firebase-storage-version',
      'x-goog-resumable',
    ],
    maxAgeSeconds: 3600,
  },
];

bucket
  .setCorsConfiguration(corsConfig)
  .then(() => console.log('CORS configured successfully on bucket:', bucket.name))
  .catch((err) => {
    console.error('Failed to set CORS:', err.message, '| code:', err.code);
    process.exit(1);
  });
