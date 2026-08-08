import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
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
        const userDoc = await getDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'customer');
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

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'users', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'users', result.user.uid), {
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role: 'customer',
        createdAt: serverTimestamp(),
      });
    }
    return result.user;
  };

  const register = async (email, password, displayName, role = 'customer') => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await setDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'users', result.user.uid), {
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
    });
    if (role === 'vendor') {
      await setDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'vendors', result.user.uid), {
        storeName: displayName,
        description: '',
        logo: '',
        rating: 0,
        totalSales: 0,
        totalProducts: 0,
        verified: false,
        createdAt: serverTimestamp(),
      });
    }
    return result.user;
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
    login,
    loginWithGoogle,
    register,
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
