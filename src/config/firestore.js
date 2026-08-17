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

// ===================== ORDERS =====================
export const createOrder = async (data) => {
  // Derive paymentStatus from paymentMethod - never trust client-supplied
  // "verified" or "completed" status. Always use pending-verification until
  // admin explicitly verifies payment via the admin dashboard.
  const paymentMethod = data.paymentMethod || 'upi';
  const defaultStatus = paymentMethod === 'cod' || paymentMethod === 'upi'
    ? 'pending-verification'
    : 'pending-verification';
  const ref = await addDoc(collection(db, 'orders'), {
    ...data,
    status: 'pending',
    paymentStatus: defaultStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getOrder = async (orderId) => {
  return withErrorLogging('getOrder', async () => {
    const ref = doc(db, 'orders', orderId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
};

// Find any existing order by this customer already using this UTR (blocks the
// same customer reusing the same reference). Scoped to the customer's own
// orders so the query satisfies the Firestore read rules.
export const getOrderByUtr = async (utr, customerId, vendorId) => {
  if (!customerId) return null;
  const predicates = [
    where('customerId', '==', customerId),
    where('paymentReference', '==', utr),
  ];
  if (vendorId) {
    predicates.push(where('vendorIds', 'array-contains', vendorId));
  }
  const q = query(collection(db, 'orders'), ...predicates, limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }
  return null;
};

// Cross-user UTR uniqueness. The doc id is the SHA-256 of the UTR, so only the
// first claim can `create` it. Returns { ref } on success, { ref, duplicate }
// if the UTR was already claimed (by anyone), or { ref, reused } when the
// caller is re-using their own still-pending claim from a failed checkout.
export const reserveUtr = async (utr, customerId) => {
  return withErrorLogging('reserveUtr', async () => {
    const utrHash = await hashText(utr);
    const ref = doc(collection(db, 'utrs'), utrHash);
    try {
      // Use a Firestore transaction to prevent TOCTOU race condition.
      const transactionResult = await db.runTransaction(async (t) => {
        const claimSnap = await t.get(ref);
        if (claimSnap.exists()) {
          const data = claimSnap.data();
          // If the claim belongs to the same customer and is still pending (orderId is null),
          // return it as reused.
          if (data.customerId === customerId && data.orderId === null) {
            return { ref, reused: true };
          }
          // If the claim exists but belongs to a different customer, or is already claimed,
          // return as duplicate.
          return { ref, duplicate: true };
        }
        // Claim does not exist yet — create it atomically.
        t.set(ref, {
          utr,
          customerId,
          orderId: null,
          pending: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { ref };
      });
      return transactionResult;
    } catch (err) {
      // Read denied or other error — the claim likely exists and belongs to someone else.
      return { ref: doc(collection(db, 'utrs'), await hashText(utr)), duplicate: true };
    }
  });
};

// Link a reserved UTR to the order once checkout succeeds.
// Uses a Firestore transaction to prevent TOCTOU race condition:
// two simultaneous calls cannot both complete the same claim.
export const completeUtrClaim = async (claimRef, orderId, customerId) => {
  return withErrorLogging('completeUtrClaim', async () => {
    const transactionResult = await db.runTransaction(async (t) => {
      const claimSnap = await t.get(claimRef);
      if (!claimSnap.exists()) {
        throw new Error('Claim not found');
      }
      const data = claimSnap.data();
      if (data.customerId !== customerId) {
        throw new Error('Unauthorized: this UTR claim does not belong to you');
      }
      if (data.pending === false) {
        throw new Error('UTR claim already completed');
      }
      t.update(claimRef, {
        orderId,
        pending: false,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    });
    return transactionResult;
  });
};

// Release an unused reservation (failed/cancelled checkout).
// Best-effort: silently handles expected cases (already completed, not found)
// and propagates real errors (permission denied, network failures).
export const cancelUtrClaim = async (claimRef) => {
  if (!claimRef) return false;
  try {
    await deleteDoc(claimRef);
    return true;
  } catch (err) {
    // Firestore error codes for expected, non-critical cases
    const isNotFound = err.code === 'not-found';
    const isAlreadyCompleted = err.code === 'failed-precondition' &&
      err.message && err.message.includes('already completed');
    // Propagate real errors (permission denied, network, etc.) so callers know
    if (!isNotFound && !isAlreadyCompleted) {
      console.error('[cancelUtrClaim] Failed to release UTR reservation:', err.message);
      throw err;
    }
    // Expected cases — silently clean up and return true
    return true;
  }
};

// ===================== INCREMENTS =====================
export const incrementProductSold = async (productId, qty = 1) => {
  return withErrorLogging('incrementProductSold', async () => {
    const ref = doc(collection(db, 'products'), productId);
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists()) {
        throw new Error('Product not found');
      }
      const data = snap.data();
      const currentStock = data.stock || 0;
      if (currentStock < qty) {
        throw new Error('Insufficient stock');
      }
      // Decrement stock by qty (guaranteed >= 0 since currentStock >= qty)
      const newStock = currentStock - qty;
      t.update(ref, {
        soldCount: increment(qty),
        stock: newStock,
        updatedAt: serverTimestamp(),
      });
    });
  });
};

export const incrementVendorSales = async (vendorId, amount, qty = 1) => {
  return withErrorLogging('incrementVendorSales', async () => {
    const ref = doc(collection(db, 'vendors'), vendorId);
    await updateDoc(ref, { totalSales: increment(qty), totalRevenue: increment(amount || 0) });
  });
};