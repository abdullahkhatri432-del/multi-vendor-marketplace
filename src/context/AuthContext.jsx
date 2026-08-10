import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'customer');
        } else if (firebaseUser.phoneNumber) {
          // Create user document for phone auth users (phone is pre-verified)
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            phoneNumber: firebaseUser.phoneNumber || '',
            role: 'customer',
            createdAt: serverTimestamp(),
          });
          setUserRole('customer');
        } else {
          setUserRole('customer');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Email/password authentication - register a new account
  const registerWithEmail = async (email, password, displayName, role = 'customer') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    if (displayName) {
      await updateProfile(firebaseUser, { displayName });
    }
    await createUserAccount(firebaseUser, displayName, role);
    return firebaseUser;
  };

  // Email/password authentication - sign in existing account
  const loginWithEmail = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  // Create user account in Firestore after verification
  const createUserAccount = async (firebaseUser, displayName, role = 'customer') => {
    // Merge instead of skip: onAuthStateChanged may have already auto-created
    // the doc (role 'customer', no name), so overwrite role + displayName.
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      email: firebaseUser.email || '',
      displayName: displayName || '',
      photoURL: firebaseUser.photoURL || '',
      phoneNumber: firebaseUser.phoneNumber || '',
      role: role,
      createdAt: serverTimestamp(),
    }, { merge: true });

    if (role === 'vendor') {
      const vendorDoc = await getDoc(doc(db, 'vendors', firebaseUser.uid));
      if (!vendorDoc.exists()) {
        await setDoc(doc(db, 'vendors', firebaseUser.uid), {
          storeName: displayName || 'My Store',
          description: '',
          logo: '',
          rating: 0,
          totalSales: 0,
          totalProducts: 0,
          verified: false,
          createdAt: serverTimestamp(),
        });
      }
    }
    setUserRole(role);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserRole(null);
  };

  const value = {
    user,
    userRole,
    loading,
    registerWithEmail,
    loginWithEmail,
    createUserAccount,
    logout,
    isAuthenticated: !!user,
    isVendor: userRole === 'vendor',
    isAdmin: userRole === 'admin',
    isCustomer: userRole === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};