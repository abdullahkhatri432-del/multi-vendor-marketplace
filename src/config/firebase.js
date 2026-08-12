import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
<<<<<<< Updated upstream
import { getFirestore } from 'firebase/firestore';

// Debug: Log Firebase config at initialization
const firebaseConfig = {
  apiKey: "AIzaSyCwLQOAJCyi9D6u3NLeH1GuyzzQ4vFKGj0",
  authDomain: "speedersmania-aecd2.firebaseapp.com",
  projectId: "speedersmania-aecd2",
  storageBucket: "speedersmania-aecd2.firebasestorage.app",
  messagingSenderId: "835568462695",
  appId: "1:835568462695:web:40578c423a474f21465dc2",
  measurementId: "G-QTF3SGCR3B"
=======
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Debug: Log Firebase config at initialization
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCwLQOAJCyi9D6u3NLeH1GuyzzQ4vFKGj0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'speedersmania-aecd2.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'speedersmania-aecd2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'speedersmania-aecd2.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '835568462695',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:835568462695:web:40578c423a474f21465dc2',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-QTF3SGCR3B',
>>>>>>> Stashed changes
};

console.log('[Firebase] Initializing with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
<<<<<<< Updated upstream
export const PROJECT_ID = 'speedersmania-aecd2';
=======
export const storage = getStorage(app);
export const PROJECT_PATH = 'projects/multi-vendor-marketplace';

// Enable offline persistence for better offline support
enableIndexedDbPersistence(db).catch((err) => {
  console.error('[Firebase] Failed to enable offline persistence:', {
    code: err.code,
    message: err.message,
  });
});

>>>>>>> Stashed changes
export default app;