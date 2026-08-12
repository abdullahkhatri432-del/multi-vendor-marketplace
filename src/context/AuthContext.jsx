import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
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
<<<<<<< Updated upstream
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
=======
        console.log('[Auth] User authenticated:', {
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        
        const userDoc = await getDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'users', firebaseUser.uid));
>>>>>>> Stashed changes
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'customer');
        } else if (firebaseUser.phoneNumber) {
          // Create user document for phone auth users (phone is pre-verified)
<<<<<<< Updated upstream
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            phoneNumber: firebaseUser.phoneNumber || '',
            role: 'customer',
            createdAt: serverTimestamp(),
          });
=======
          try {
            await setDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'users', firebaseUser.uid), {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              phoneNumber: firebaseUser.phoneNumber || '',
              role: 'customer',
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });
            console.log('[Auth] Created user document for phone auth user:', firebaseUser.uid);
          } catch (err) {
            console.error('[Auth] Failed to create user document:', err);
          }
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  // Email/password authentication - register a new account
  const registerWithEmail = async (email, password, displayName, role = 'customer') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    if (displayName) {
      await updateProfile(firebaseUser, { displayName });
    }
    await createUserAccount(firebaseUser, displayName, role);
    return firebaseUser;
=======
  // Phone authentication - sends OTP for registration
  const registerWithPhone = async (phoneNumber, appVerifier) => {
    try {
      console.log('[Auth] Sending OTP for registration:', phoneNumber);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      console.log('[Auth] OTP sent for registration');
      return confirmationResult;
    } catch (err) {
      console.error('[Auth] registerWithPhone error:', err);
      throw err;
    }
  };

  // Phone authentication - sends OTP for login
  const loginWithPhone = async (phoneNumber, appVerifier) => {
    try {
      console.log('[Auth] Sending OTP for login:', phoneNumber);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      console.log('[Auth] OTP sent for login');
      return confirmationResult;
    } catch (err) {
      console.error('[Auth] loginWithPhone error:', err);
      throw err;
    }
  };

  // Verify OTP code
  const verifyPhoneCode = async (confirmationResult, code) => {
    try {
      console.log('[Auth] Verifying OTP code');
      const result = await confirmationResult.confirm(code);
      console.log('[Auth] OTP verified successfully for user:', result.user.uid);
      return result.user;
    } catch (err) {
      console.error('[Auth] verifyPhoneCode error:', err);
      throw err;
    }
>>>>>>> Stashed changes
  };

  // Email/password authentication - sign in existing account
  const loginWithEmail = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  // Send password reset email
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Create user account in Firestore after verification
  const createUserAccount = async (firebaseUser, displayName, role = 'customer') => {
<<<<<<< Updated upstream
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
=======
    try {
      const userDoc = await getDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'users', firebaseUser.uid), {
          email: firebaseUser.email || '',
          displayName: displayName || '',
          photoURL: firebaseUser.photoURL || '',
          phoneNumber: firebaseUser.phoneNumber || '',
          role: role,
>>>>>>> Stashed changes
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });

        if (role === 'vendor') {
          await setDoc(doc(db, 'projects', 'multi-vendor-marketplace', 'vendors', firebaseUser.uid), {
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
      console.log('[Auth] User account created/updated for:', firebaseUser.uid);
    } catch (err) {
      console.error('[Auth] createUserAccount error:', err);
      throw err;
    }
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
<<<<<<< Updated upstream
    registerWithEmail,
    loginWithEmail,
    resetPassword,
=======
    loginWithPhone,
    registerWithPhone,
    verifyPhoneCode,
>>>>>>> Stashed changes
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