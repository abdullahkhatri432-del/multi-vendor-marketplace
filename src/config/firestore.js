import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { fallbackProducts, fallbackVendors, findFallbackProduct, findFallbackVendor, fallbackCoupons, findFallbackCoupon } from './fallbackData';

// Demo/fallback catalogue. Off unless explicitly enabled, so a real deployment
// (and local dev against the live project) never shows fake products, fake
// vendors or fake coupons. Opt in with VITE_ENABLE_DEMO_DATA=true.
export const DEMO_ENABLED = import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';

const demoProducts = () => (DEMO_ENABLED ? fallbackProducts : []);
const demoCoupons = () => (DEMO_ENABLED ? fallbackCoupons : []);

// Helper to create collection references
const col = (name) => collection(db, name);

const usersCol = () => col('users');
const vendorsCol = () => col('vendors');
const productsCol = () => col('products');
const pendingProductsCol = () => col('pending_products');
const ordersCol = () => col('orders');
const categoriesCol = () => col('categories');
const couponsCol = () => col('coupons');

// ===================== DEBUG WRAPPER =====================
const debug = import.meta.env.DEV;
const withErrorLogging = async (operationName, fn) => {
  const startTime = Date.now();
  try {
    if (debug) console.log(`[Firestore] ${operationName} - START`);
    const result = await fn();
    if (debug) console.log(`[Firestore] ${operationName} - SUCCESS (${Date.now() - startTime}ms)`);
    return result;
  } catch (error) {
    console.error(`[Firestore] ${operationName} - FAILED (${Date.now() - startTime}ms):`, {
      code: error.code,
      message: error.message,
    });
    // Re-throw with enhanced context
    const enhancedError = new Error(`[${operationName}] ${error.message}`);
    enhancedError.code = error.code;
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

// ===================== USERS =====================
export const createUser = async (uid, data) => {
  return withErrorLogging('createUser', async () => {
    const ref = doc(usersCol(), uid);
    await setDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref;
  });
};

export const getUser = async (uid) => {
  return withErrorLogging('getUser', async () => {
    const ref = doc(usersCol(), uid);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
};

export const updateUser = async (uid, data) => {
  return withErrorLogging('updateUser', async () => {
    const ref = doc(usersCol(), uid);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  });
};

// ===================== VENDORS =====================
// Create the vendor profile for a user if it does not exist yet.
// Only fields that `firestore.rules` lets a vendor write are included — trust
// and aggregate fields (verified, rating, totalSales, totalProducts) are
// intentionally omitted, otherwise the create is rejected and the profile is
// silently missing while the user role says "vendor".
export const ensureVendorProfile = async (uid, data = {}) => {
  return withErrorLogging('ensureVendorProfile', async () => {
    const ref = doc(vendorsCol(), uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return { id: snap.id, ...snap.data() };

    const profile = {
      storeName: data.storeName || 'My Store',
      description: data.description || '',
      logo: data.logo || '',
      verified: false,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return { id: uid, ...profile };
  });
};

export const createVendor = async (uid, data) => {
  return withErrorLogging('createVendor', async () => {
    await ensureVendorProfile(uid, data);
    return doc(vendorsCol(), uid);
  });
};

export const getVendor = async (vendorId) => {
  return withErrorLogging('getVendor', async () => {
    const ref = doc(vendorsCol(), vendorId);
    const snap = await getDoc(ref);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return DEMO_ENABLED ? findFallbackVendor(vendorId) : null;
  });
};

export const updateVendor = async (vendorId, data) => {
  return withErrorLogging('updateVendor', async () => {
    const ref = doc(vendorsCol(), vendorId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  });
};

export const getAllVendors = async () => {
  return withErrorLogging('getAllVendors', async () => {
    const snap = await getDocs(vendorsCol());
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (docs.length > 0) return docs;
    return DEMO_ENABLED ? fallbackVendors : [];
  });
};

export const getVerifiedVendors = async () => {
  return withErrorLogging('getVerifiedVendors', async () => {
    const q = query(vendorsCol(), where('verified', '==', true));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (docs.length > 0) return docs;
    return DEMO_ENABLED ? fallbackVendors.filter((v) => v.verified) : [];
  });
};

// Cached vendorId -> vendor map so cards can show "Verified" badges without
// firing one query per product. Refresh per session via clearVendorsCache().
let vendorsMapCache = null;

export const getVendorsMap = async () => {
  if (vendorsMapCache) return vendorsMapCache;
  return withErrorLogging('getVendorsMap', async () => {
    const snap = await getDocs(vendorsCol());
    vendorsMapCache = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
    return vendorsMapCache;
  });
};

export const clearVendorsCache = () => {
  vendorsMapCache = null;
};

// ===================== PRODUCTS =====================
export const createProduct = async (data) => {
  return withErrorLogging('createProduct', async () => {
    const ref = await addDoc(productsCol(), {
      ...data,
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
      active: data.active !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  });
};

const productCache = new Map();

export const getProduct = async (productId) => {
  if (productCache.has(productId)) {
    return productCache.get(productId);
  }
  return withErrorLogging('getProduct', async () => {
    const ref = doc(productsCol(), productId);
    const snap = await getDoc(ref);
    const data = snap.exists() ? { id: snap.id, ...snap.data() } : (DEMO_ENABLED ? findFallbackProduct(productId) : null);
    if (data) productCache.set(productId, data);
    return data;
  });
};

export const prefetchProduct = async (productId) => {
  if (!productCache.has(productId)) {
    getProduct(productId).catch(() => {});
  }
};

export const updateProduct = async (productId, data) => {
  return withErrorLogging('updateProduct', async () => {
    const ref = doc(productsCol(), productId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  });
};

export const deleteProduct = async (productId) => {
  return withErrorLogging('deleteProduct', async () => {
    const ref = doc(productsCol(), productId);
    await deleteDoc(ref);
  });
};

export const getAllProducts = async (limitCount = 50) => {
  return withErrorLogging('getAllProducts', async () => {
    const q = query(productsCol(), where('active', '==', true), orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return docs.length > 0 ? docs : demoProducts().slice(0, limitCount);
  });
};

export const getProductsByVendor = async (vendorId) => {
  return withErrorLogging('getProductsByVendor', async () => {
    const q = query(productsCol(), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (docs.length > 0) return docs;
    return demoProducts().filter((p) => p.vendorId === vendorId);
  });
};

export const getProductsByCategory = async (category) => {
  return withErrorLogging('getProductsByCategory', async () => {
    const q = query(productsCol(), where('category', '==', category), where('active', '==', true));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (docs.length > 0) return docs;
    return demoProducts().filter((p) => p.active && p.category === category);
  });
};

export const searchProducts = async (searchTerm) => {
  return withErrorLogging('searchProducts', async () => {
    const snap = await getDocs(productsCol());
    const term = searchTerm.toLowerCase();
    const docs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (p) =>
          p.active &&
          (p.name?.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term))
      );
    if (docs.length > 0) return docs;
    return demoProducts().filter(
      (p) =>
        p.active &&
        (p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term))
    );
  });
};

// ===================== ORDERS =====================
// Orders are created by /api/create-order (server-authoritative). The client
// only reads them.

export const getOrder = async (orderId) => {
  return withErrorLogging('getOrder', async () => {
    const ref = doc(ordersCol(), orderId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
};

export const updateOrder = async (orderId, data) => {
  return withErrorLogging('updateOrder', async () => {
    const ref = doc(ordersCol(), orderId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  });
};

export const verifyOrderPayment = async (orderId, { utr, amount, matchedBy = 'manual' }) => {
  return withErrorLogging('verifyOrderPayment', async () => {
    const ref = doc(ordersCol(), orderId);
    await updateDoc(ref, {
      paymentStatus: 'verified',
      verifiedAt: serverTimestamp(),
      verifiedBy: 'admin',
      verifiedUtr: utr,
      verifiedAmount: amount,
      matchedBy,
      updatedAt: serverTimestamp(),
    });
  });
};

export const getOrdersByUser = async (userId) => {
  return withErrorLogging('getOrdersByUser', async () => {
    const q = query(ordersCol(), where('customerId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

// Orders where this vendor's products appear (items[].vendorId). Orders store a
// vendorIds[] array so this is a cheap, rules-safe array-contains query.
export const getOrdersByVendor = async (vendorId) => {
  return withErrorLogging('getOrdersByVendor', async () => {
    const snap = await getDocs(query(ordersCol(), where('vendorIds', 'array-contains', vendorId), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

export const getAllOrders = async () => {
  return withErrorLogging('getAllOrders', async () => {
    const q = query(ordersCol(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

// ===================== CATEGORIES =====================
export const createCategory = async (data) => {
  return withErrorLogging('createCategory', async () => {
    const ref = await addDoc(categoriesCol(), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  });
};

export const getAllCategories = async () => {
  return withErrorLogging('getAllCategories', async () => {
    const snap = await getDocs(categoriesCol());
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

// ===================== COUPONS =====================
export const createCoupon = async (data) => {
  return withErrorLogging('createCoupon', async () => {
    const code = String(data.code || '').trim().toUpperCase();
    const ref = await addDoc(couponsCol(), {
      ...data,
      code,
      active: data.active !== false,
      usedCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  });
};

export const getAllCoupons = async () => {
  return withErrorLogging('getAllCoupons', async () => {
    const snap = await getDocs(query(couponsCol(), orderBy('createdAt', 'desc')));
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return docs.length > 0 ? docs : demoCoupons();
  });
};

export const getCouponByCode = async (code) => {
  return withErrorLogging('getCouponByCode', async () => {
    const normalized = String(code || '').trim().toUpperCase();
    const q = query(couponsCol(), where('code', '==', normalized), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    return DEMO_ENABLED ? findFallbackCoupon(normalized) : null;
  });
};

export const updateCoupon = async (couponId, data) => {
  return withErrorLogging('updateCoupon', async () => {
    const ref = doc(couponsCol(), couponId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  });
};

export const deleteCoupon = async (couponId) => {
  return withErrorLogging('deleteCoupon', async () => {
    await deleteDoc(doc(couponsCol(), couponId));
  });
};

// ===================== PLATFORM STATS =====================
export const getPlatformStats = async () => {
  return withErrorLogging('getPlatformStats', async () => {
    const [users, vendors, products, orders] = await Promise.all([
      getDocs(usersCol()),
      getDocs(vendorsCol()),
      getDocs(productsCol()),
      getDocs(ordersCol()),
    ]);

    // Cancelled orders aren't revenue. Count orders that still stand.
    const validOrders = orders.docs
      .map((d) => d.data())
      .filter((o) => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      totalUsers: users.size,
      totalVendors: vendors.size,
      totalProducts: products.size,
      totalOrders: validOrders.length,
      totalRevenue,
    };
  });
};

// ===================== USERS ADMIN =====================
export const getAllUsers = async () => {
  return withErrorLogging('getAllUsers', async () => {
    const snap = await getDocs(query(usersCol(), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

export const updateUserRole = async (userId, role) => {
  return withErrorLogging('updateUserRole', async () => {
    const ref = doc(usersCol(), userId);
    await updateDoc(ref, { role });

    // Promoting someone to vendor must also create their storefront profile,
    // otherwise their products have a vendorId with no matching vendor doc and
    // the public store page 404s.
    if (role === 'vendor') {
      const userSnap = await getDoc(ref);
      const displayName = userSnap.exists() ? userSnap.data().displayName : '';
      await ensureVendorProfile(userId, { storeName: displayName || 'My Store' });
    }
  });
};

export const deleteUser = async (userId) => {
  return withErrorLogging('deleteUser', async () => {
    const ref = doc(usersCol(), userId);
    await deleteDoc(ref);
  });
};

export const updateOrderStatus = async (orderId, status) => {
  return withErrorLogging('updateOrderStatus', async () => {
    const ref = doc(ordersCol(), orderId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  });
};

export const deleteOrder = async (orderId) => {
  return withErrorLogging('deleteOrder', async () => {
    const ref = doc(ordersCol(), orderId);
    await deleteDoc(ref);
  });
};

export const deleteProductById = async (productId) => {
  return withErrorLogging('deleteProductById', async () => {
    const ref = doc(productsCol(), productId);
    await deleteDoc(ref);
  });
};

export const deleteCategory = async (categoryId) => {
  return withErrorLogging('deleteCategory', async () => {
    const ref = doc(categoriesCol(), categoryId);
    await deleteDoc(ref);
  });
};

// ===================== REVIEWS =====================
export const createReview = async (productId, data) => {
  return withErrorLogging('createReview', async () => {
    const ref = await addDoc(collection(db, 'reviews'), {
      ...data,
      productId,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  });
};

export const getReviewsByProduct = async (productId) => {
  return withErrorLogging('getReviewsByProduct', async () => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

export const getProductRating = async (productId) => {
  return withErrorLogging('getProductRating', async () => {
    const reviews = await getReviewsByProduct(productId);
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    return { avg: Math.round(avg * 10) / 10, count: reviews.length };
  });
};

// ===================== WISHLIST =====================
export const addToWishlist = async (userId, productId) => {
  return withErrorLogging('addToWishlist', async () => {
    const ref = doc(db, 'users', userId, 'wishlist', productId);
    await setDoc(ref, { productId, addedAt: serverTimestamp() });
  });
};

export const removeFromWishlist = async (userId, productId) => {
  return withErrorLogging('removeFromWishlist', async () => {
    const ref = doc(db, 'users', userId, 'wishlist', productId);
    await deleteDoc(ref);
  });
};

export const getWishlist = async (userId) => {
  return withErrorLogging('getWishlist', async () => {
    const snap = await getDocs(
      collection(db, 'users', userId, 'wishlist')
    );
    return snap.docs.map((d) => d.data().productId);
  });
};

// ===================== VENDOR PROFILE =====================
export const getVendorProfile = async (vendorId) => {
  return withErrorLogging('getVendorProfile', async () => {
    const ref = doc(vendorsCol(), vendorId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
};

export const updateVendorProfile = async (vendorId, data) => {
  return withErrorLogging('updateVendorProfile', async () => {
    const ref = doc(vendorsCol(), vendorId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  });
};

// ===================== VENDOR ANALYTICS =====================
export const getVendorAnalytics = async (vendorId) => {
  return withErrorLogging('getVendorAnalytics', async () => {
    const orders = await getOrdersByVendor(vendorId);

    const totalRevenue = orders.reduce((sum, o) => {
      if (o.status === 'cancelled') return sum;
      const items = (o.items || []).filter((it) => it.vendorId === vendorId);
      return sum + items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1) + (it.addonTotal || 0), 0);
    }, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const completedOrders = orders.filter((o) => o.status === 'delivered').length;

    return { totalRevenue, totalOrders, pendingOrders, completedOrders, orders };
  });
};

// ===================== PENDING PRODUCTS (Bulk Import Drafts) =====================
export const createPendingProduct = async (data) => {
  return withErrorLogging('createPendingProduct', async () => {
    const ref = await addDoc(pendingProductsCol(), {
      ...data,
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  });
};

export const getPendingProducts = async (vendorId) => {
  return withErrorLogging('getPendingProducts', async () => {
    const q = query(pendingProductsCol(), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

export const getPendingProduct = async (productId) => {
  return withErrorLogging('getPendingProduct', async () => {
    const ref = doc(pendingProductsCol(), productId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
};

export const updatePendingProduct = async (productId, data) => {
  return withErrorLogging('updatePendingProduct', async () => {
    const ref = doc(pendingProductsCol(), productId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  });
};

export const deletePendingProduct = async (productId) => {
  return withErrorLogging('deletePendingProduct', async () => {
    const ref = doc(pendingProductsCol(), productId);
    await deleteDoc(ref);
  });
};

export const publishPendingProduct = async (productId) => {
  return withErrorLogging('publishPendingProduct', async () => {
    const pendingRef = doc(pendingProductsCol(), productId);
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) {
      throw new Error('Pending product not found');
    }

    const pendingData = pendingSnap.data();

    // Create in main products collection
    const productRef = await addDoc(productsCol(), {
      ...pendingData,
      status: 'active',
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Delete from pending_products
    await deleteDoc(pendingRef);

    return productRef.id;
  });
};

// ===================== NEWSLETTER =====================
const newsletterCol = () => col('newsletter_subscribers');

// Cryptographically hash the email so the doc ID is deterministic and doesn't
// leak the raw address in the URL/path (it still lives in the `email` field).
const hashEmail = async (email) => {
  const data = new TextEncoder().encode(email);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Subscribe an email to the newsletter. Idempotent: the doc ID is the SHA-256
 * hash of the email, so re-subscribing writes to the same doc (no duplicates,
 * and no reads are required). Re-subscribing re-asserts `subscribed: true`.
 */
export const subscribeToNewsletter = async (email) => {
  return withErrorLogging('subscribeToNewsletter', async () => {
    const normalized = email.trim().toLowerCase();
    const ref = doc(newsletterCol(), await hashEmail(normalized));

    try {
      await setDoc(ref, {
        email: normalized,
        source: 'footer',
        subscribed: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { subscribed: true, alreadySubscribed: false };
    } catch (err) {
      // Existing doc: the create above is rejected because Firestore treats it
      // as an update and the rules only allow changing `subscribed`/`updatedAt`.
      // Retry as a minimal idempotent update.
      if (err?.code === 'permission-denied' || err?.code === 'already-exists') {
        await updateDoc(ref, {
          subscribed: true,
          updatedAt: serverTimestamp(),
        });
        return { subscribed: true, alreadySubscribed: true };
      }
      throw err;
    }
  });
};
