import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Public Firebase web config. These values are safe to ship to the browser —
// they identify the project, they do not grant admin access (that is enforced
// by Firestore/Storage rules).
//
// Prefer setting VITE_FIREBASE_* env vars; the literal values below are the
// fallback so CI/pages builds without a .env still work.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCwLQOAJCyi9D6u3NLeH1GuyzzQ4vFKGj0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'speedersmania-aecd2.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'speedersmania-aecd2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'speedersmania-aecd2.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '835568462695',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:835568462695:web:40578c423a474f21465dc2',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-QTF3SGCR3B',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const PROJECT_ID = firebaseConfig.projectId;
export default app;
