import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDArdfp21Rr20qpoL_4pSRBy00HJrcUJ7o',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'myprojects-ebc25.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'myprojects-ebc25',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'myprojects-ebc25.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '121866851521',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:121866851521:web:6d13b45e15d00deef4f040',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-X53ETGLJS4',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const PROJECT_PATH = 'projects/multi-vendor-marketplace';
export default app;
