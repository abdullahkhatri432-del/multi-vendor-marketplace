import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Debug: Log Firebase config at initialization
const firebaseConfig = {
  apiKey: "AIzaSyCwLQOAJCyi9D6u3NLeH1GuyzzQ4vFKGj0",
  authDomain: "speedersmania-aecd2.firebaseapp.com",
  projectId: "speedersmania-aecd2",
  storageBucket: "speedersmania-aecd2.firebasestorage.app",
  messagingSenderId: "835568462695",
  appId: "1:835568462695:web:40578c423a474f21465dc2",
  measurementId: "G-QTF3SGCR3B"
};

console.log('[Firebase] Initializing with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const PROJECT_ID = 'speedersmania-aecd2';
export default app;