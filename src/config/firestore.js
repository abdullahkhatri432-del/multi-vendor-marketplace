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
