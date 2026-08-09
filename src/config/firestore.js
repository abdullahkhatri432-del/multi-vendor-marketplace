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

const col = (name) => collection(db, 'projects', 'multi-vendor-marketplace', name);

const usersCol = () => col('users');
const vendorsCol = () => col('vendors');
const productsCol = () => col('products');
const pendingProductsCol = () => col('pending_products');
const ordersCol = () => col('orders');
const categoriesCol = () => col('categories');

export const createUser = async (uid, data) => {
  const ref = doc(usersCol(), uid);
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref;
};

export const getUser = async (uid) => {
  const ref = doc(usersCol(), uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUser = async (uid, data) => {
  const ref = doc(usersCol(), uid);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const createVendor = async (uid, data) => {
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
};

export const getVendor = async (vendorId) => {
  const ref = doc(vendorsCol(), vendorId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateVendor = async (vendorId, data) => {
  const ref = doc(vendorsCol(), vendorId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const getAllVendors = async () => {
  const snap = await getDocs(vendorsCol());
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getVerifiedVendors = async () => {
  const q = query(vendorsCol(), where('verified', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createProduct = async (data) => {
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
};

export const getProduct = async (productId) => {
  const ref = doc(productsCol(), productId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateProduct = async (productId, data) => {
  const ref = doc(productsCol(), productId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteProduct = async (productId) => {
  const ref = doc(productsCol(), productId);
  await deleteDoc(ref);
};

export const getAllProducts = async (limitCount = 50) => {
  const q = query(productsCol(), where('active', '==', true), orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getProductsByVendor = async (vendorId) => {
  const q = query(productsCol(), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getProductsByCategory = async (category) => {
  const q = query(productsCol(), where('category', '==', category), where('active', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const searchProducts = async (searchTerm) => {
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
};

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
  const ref = doc(ordersCol(), orderId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateOrder = async (orderId, data) => {
  const ref = doc(ordersCol(), orderId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const getOrdersByUser = async (userId) => {
  const q = query(ordersCol(), where('customerId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getOrdersByVendor = async (vendorId) => {
  const q = query(ordersCol(), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllOrders = async () => {
  const q = query(ordersCol(), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createCategory = async (data) => {
  const ref = await addDoc(categoriesCol(), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getAllCategories = async () => {
  const snap = await getDocs(categoriesCol());
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPlatformStats = async () => {
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
};

export const incrementProductSold = async (productId, qty = 1) => {
  const ref = doc(productsCol(), productId);
  await updateDoc(ref, { soldCount: increment(qty) });
};

export const incrementVendorSales = async (vendorId, amount) => {
  const ref = doc(vendorsCol(), vendorId);
  await updateDoc(ref, { totalSales: increment(1) });
};

export const getAllUsers = async () => {
  const snap = await getDocs(query(usersCol(), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateUserRole = async (userId, role) => {
  const ref = doc(usersCol(), userId);
  await updateDoc(ref, { role });
};

export const deleteUser = async (userId) => {
  const ref = doc(usersCol(), userId);
  await deleteDoc(ref);
};

export const updateOrderStatus = async (orderId, status) => {
  const ref = doc(ordersCol(), orderId);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
};

export const deleteOrder = async (orderId) => {
  const ref = doc(ordersCol(), orderId);
  await deleteDoc(ref);
};

export const deleteProductById = async (productId) => {
  const ref = doc(productsCol(), productId);
  await deleteDoc(ref);
};

export const deleteCategory = async (categoryId) => {
  const ref = doc(categoriesCol(), categoryId);
  await deleteDoc(ref);
};

// Reviews
export const createReview = async (productId, data) => {
  const ref = await addDoc(collection(db, 'projects', 'multi-vendor-marketplace', 'reviews'), {
    ...data,
    productId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getReviewsByProduct = async (productId) => {
  const q = query(
    collection(db, 'projects', 'multi-vendor-marketplace', 'reviews'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getProductRating = async (productId) => {
  const reviews = await getReviewsByProduct(productId);
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
};

// Wishlist (stored as subcollection under user)
export const addToWishlist = async (userId, productId) => {
  const ref = doc(db, 'projects', 'multi-vendor-marketplace', 'users', userId, 'wishlist', productId);
  await setDoc(ref, { productId, addedAt: serverTimestamp() });
};

export const removeFromWishlist = async (userId, productId) => {
  const ref = doc(db, 'projects', 'multi-vendor-marketplace', 'users', userId, 'wishlist', productId);
  await deleteDoc(ref);
};

export const getWishlist = async (userId) => {
  const snap = await getDocs(
    collection(db, 'projects', 'multi-vendor-marketplace', 'users', userId, 'wishlist')
  );
  return snap.docs.map((d) => d.data().productId);
};

// Vendor store profile
export const getVendorProfile = async (vendorId) => {
  const ref = doc(vendorsCol(), vendorId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateVendorProfile = async (vendorId, data) => {
  const ref = doc(vendorsCol(), vendorId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

// Vendor analytics
export const getVendorAnalytics = async (vendorId) => {
  const ordersQuery = query(ordersCol(), where('vendorId', '==', vendorId));
  const snap = await getDocs(ordersQuery);

  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const completedOrders = orders.filter((o) => o.status === 'delivered').length;

  return { totalRevenue, totalOrders, pendingOrders, completedOrders, orders };
};

// ===================== PENDING PRODUCTS (Bulk Import Drafts) =====================
export const createPendingProduct = async (data) => {
  const ref = await addDoc(pendingProductsCol(), {
    ...data,
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getPendingProducts = async (vendorId) => {
  const q = query(pendingProductsCol(), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPendingProduct = async (productId) => {
  const ref = doc(pendingProductsCol(), productId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updatePendingProduct = async (productId, data) => {
  const ref = doc(pendingProductsCol(), productId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deletePendingProduct = async (productId) => {
  const ref = doc(pendingProductsCol(), productId);
  await deleteDoc(ref);
};

export const publishPendingProduct = async (productId) => {
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
};
