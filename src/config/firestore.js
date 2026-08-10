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
import { db, PROJECT_PATH } from './firebase';

// Helper to create collection references
const col = (name) => collection(db, 'projects', 'multi-vendor-marketplace', name);

const usersCol = () => col('users');
const vendorsCol = () => col('vendors');
const productsCol = () => col('products');
const pendingProductsCol = () => col('pending_products');
const ordersCol = () => col('orders');
const categoriesCol = () => col('categories');

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
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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
      active: true,
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
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

export const searchProducts = async (searchTerm) => {
  return withErrorLogging('searchProducts', async () => {
    const snap = await getDocs(productsCol());
    const term = searchTerm.toLowerCase();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
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
  return withErrorLogging('createOrder', async () => {
    const ref = await addDoc(ordersCol(), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  });
};

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

export const getOrdersByUser = async (userId) => {
  return withErrorLogging('getOrdersByUser', async () => {
    const q = query(ordersCol(), where('customerId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
};

export const getOrdersByVendor = async (vendorId) => {
  return withErrorLogging('getOrdersByVendor', async () => {
    const q = query(ordersCol(), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
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
    await updateDoc(ref, { totalSales: increment(1) });
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
    const ref = await addDoc(collection(db, 'projects', 'multi-vendor-marketplace', 'reviews'), {
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
      collection(db, 'projects', 'multi-vendor-marketplace', 'reviews'),
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
    const ref = doc(db, 'projects', 'multi-vendor-marketplace', 'users', userId, 'wishlist', productId);
    await setDoc(ref, { productId, addedAt: serverTimestamp() });
  });
};

export const removeFromWishlist = async (userId, productId) => {
  return withErrorLogging('removeFromWishlist', async () => {
    const ref = doc(db, 'projects', 'multi-vendor-marketplace', 'users', userId, 'wishlist', productId);
    await deleteDoc(ref);
  });
};

export const getWishlist = async (userId) => {
  return withErrorLogging('getWishlist', async () => {
    const snap = await getDocs(
      collection(db, 'projects', 'multi-vendor-marketplace', 'users', userId, 'wishlist')
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
    const ordersQuery = query(ordersCol(), where('vendorId', '==', vendorId));
    const snap = await getDocs(ordersQuery);

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
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

/**
 * Subscribe an email to the newsletter. Idempotent — returns whether this was
 * a brand-new subscription or the email was already on the list.
 */
export const subscribeToNewsletter = async (email) => {
  return withErrorLogging('subscribeToNewsletter', async () => {
    const normalized = email.trim().toLowerCase();

    // Dedupe: treat as already subscribed if an active entry exists for this email.
    const existing = await getDocs(
      query(newsletterCol(), where('email', '==', normalized), limit(1))
    );

    if (!existing.empty) {
      return { subscribed: false, alreadySubscribed: true };
    }

    await addDoc(newsletterCol(), {
      email: normalized,
      source: 'footer',
      subscribed: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { subscribed: true, alreadySubscribed: false };
  });
};