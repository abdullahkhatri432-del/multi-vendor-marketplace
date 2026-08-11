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
  startAfter,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { PROJECT_ID } from './firebase';
import { fallbackProducts, fallbackVendors, findFallbackProduct, findFallbackVendor, fallbackCoupons, findFallbackCoupon } from './fallbackData';

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
const withErrorLogging = async (operationName, fn) => {
  const startTime = Date.now();
  try {
    console.log(`[Firestore] ${operationName} - START`);
    const result = await fn();
    console.log(`[Firestore] ${operationName} - SUCCESS (${Date.now() - startTime}ms)`);
    return result;
  } catch (error) {
    console.error(`[Firestore] ${operationName} - FAILED (${Date.now() - startTime}ms):`, {
      code: error.code,
      message: error.message,
      stack: error.stack,
      name: error.name,
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
export const createVendor = async (uid, data) => {
  return withErrorLogging('createVendor', async () => {
    const ref = doc(vendorsCol(), uid);
    await setDoc(ref, {
      ...data,
      rating: 0,
      totalSales: 0,
      totalProducts: 0,
      verified: false,
      createdAt: serverTimestamp(),
    });
    return ref;
  });
};

export const getVendor = async (vendorId) => {
  return withErrorLogging('getVendor', async () => {
    const ref = doc(vendorsCol(), vendorId);
    const snap = await getDoc(ref);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return findFallbackVendor(vendorId);
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

export const getVerifiedVendors = async () => {
  return withErrorLogging('getVerifiedVendors', async () => {
    const q = query(vendorsCol(), where('verified', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
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

export const getProduct = async (productId) => {
  return withErrorLogging('getProduct', async () => {
    const ref = doc(productsCol(), productId);
    const snap = await getDoc(ref);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return findFallbackProduct(productId);
  });
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
    return docs.length > 0 ? docs : fallbackProducts.slice(0, limitCount);
  });
};

export const getProductsByVendor = async (vendorId) => {
  return withErrorLogging('getProductsByVendor', async () => {
    const q = query(productsCol(), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

export const getProductsByCategory = async (category) => {
  return withErrorLogging('getProductsByCategory', async () => {
    const q = query(productsCol(), where('category', '==', category), where('active', '==', true));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (docs.length > 0) return docs;
    return fallbackProducts.filter((p) => p.active && p.category === category);
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
    return fallbackProducts.filter(
      (p) =>
        p.active &&
        (p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term))
    );
  });
};

// ===================== ORDERS =====================
export const createOrder = async (data) => {
  const ref = await addDoc(ordersCol(), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getOrder = async (orderId) => {
  return withErrorLogging('getOrder', async () => {
    const ref = doc(ordersCol(), orderId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
};

// Find any existing order already using this UTR (blocks reuse of the same reference).
export const getOrderByUtr = async (utr) => {
  return withErrorLogging('getOrderByUtr', async () => {
    const q = query(ordersCol(), where('paymentReference', '==', utr), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }
    const q2 = query(ordersCol(), where('paymentDetails.transactionRef', '==', utr), limit(1));
    const snap2 = await getDocs(q2);
    return snap2.empty ? null : { id: snap2.docs[0].id, ...snap2.docs[0].data() };
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

// Orders where this vendor's products appear (items[].vendorId). New orders store a
// vendorIds[] array for cheap queries; legacy orders fall back to an in-memory scan.
export const getOrdersByVendor = async (vendorId) => {
  return withErrorLogging('getOrdersByVendor', async () => {
    let snap = await getDocs(query(ordersCol(), where('vendorIds', 'array-contains', vendorId), orderBy('createdAt', 'desc')));
    let orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (orders.length === 0) {
      const all = await getDocs(ordersCol());
      orders = all.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((o) => (o.items || []).some((it) => it.vendorId === vendorId));
    }
    return orders;
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
    return docs.length > 0 ? docs : fallbackCoupons;
  });
};

export const getCouponByCode = async (code) => {
  return withErrorLogging('getCouponByCode', async () => {
    const normalized = String(code || '').trim().toUpperCase();
    const q = query(couponsCol(), where('code', '==', normalized), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    return findFallbackCoupon(normalized);
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

export const incrementCouponUsage = async (couponId) => {
  return withErrorLogging('incrementCouponUsage', async () => {
    await updateDoc(doc(couponsCol(), couponId), {
      usedCount: increment(1),
      updatedAt: serverTimestamp(),
    });
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

    const totalRevenue = orders.docs.reduce((sum, d) => sum + (d.data().total || 0), 0);

    return {
      totalUsers: users.size,
      totalVendors: vendors.size,
      totalProducts: products.size,
      totalOrders: orders.size,
      totalRevenue,
    };
  });
};

// ===================== INCREMENTS =====================
export const incrementProductSold = async (productId, qty = 1) => {
  return withErrorLogging('incrementProductSold', async () => {
    const ref = doc(productsCol(), productId);
    await updateDoc(ref, { soldCount: increment(qty) });
  });
};

export const incrementVendorSales = async (vendorId, amount) => {
  return withErrorLogging('incrementVendorSales', async () => {
    const ref = doc(vendorsCol(), vendorId);
    await updateDoc(ref, { totalSales: increment(1), totalRevenue: increment(amount || 0) });
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
 * Subscribe an email to the newsletter. Idempotent — the doc ID is the SHA-256
 * hash of the email, so re-subscribing writes to the same doc (no duplicates,
 * and no reads are required).
 */
export const subscribeToNewsletter = async (email) => {
  return withErrorLogging('subscribeToNewsletter', async () => {
    const normalized = email.trim().toLowerCase();
    const ref = doc(newsletterCol(), await hashEmail(normalized));

    // `create` semantics are enforced in Firestore rules (allow create only),
    // so an existing doc makes this throw a "document already exists" error,
    // which we surface to the user as an already-subscribed message.
    let alreadySubscribed = false;
    try {
      await setDoc(ref, {
        email: normalized,
        source: 'footer',
        subscribed: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (err?.code === 'already-exists') alreadySubscribed = true;
      else throw err;
    }

    return { subscribed: !alreadySubscribed, alreadySubscribed };
  });
};