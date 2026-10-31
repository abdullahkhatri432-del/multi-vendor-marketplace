// Order lifecycle endpoint.
//
// Status changes must not be a raw Firestore write: cancelling/returning an
// order has to restore stock, roll back vendor aggregates and coupon usage, and
// append an audit entry — all atomically. This endpoint is the single writer
// for those transitions (Firestore rules deny vendor/client updates).
//
// Roles:
//   customer — may cancel their own order while it is not yet shipped
//   vendor   — may advance their own orders (processing → shipped → delivered)
//              and cancel orders that contain only their items
//   admin    — may set any valid status, add tracking, record refunds
const {
  HttpError,
  getDb,
  authenticate,
  applyCors,
  rateLimit,
  FieldValue,
} = require('../lib/http.cjs');
const ops = require('../lib/ops.cjs');

const ADMIN_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out-for-delivery',
  'delivered',
  'cancelled',
  'return-requested',
  'returned',
  'refunded',
];

const RESTOCK_STATUSES = new Set(['cancelled', 'returned', 'refunded']);

// Transitions a vendor may perform on their own order.
const VENDOR_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  'out-for-delivery': ['delivered'],
};

const CUSTOMER_CANCELLABLE = new Set(['pending', 'confirmed', 'processing', 'packed']);

const cleanText = (value, max) => String(value || '').trim().slice(0, max);

function sanitizeTracking(body) {
  const trackingNumber = cleanText(body.trackingNumber, 64);
  const rawUrl = cleanText(body.trackingUrl, 500);
  let trackingUrl = '';
  if (rawUrl) {
    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new HttpError(400, 'Tracking URL must be a valid http(s) link.');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new HttpError(400, 'Tracking URL must be a valid http(s) link.');
    }
    trackingUrl = parsed.toString();
  }
  return { trackingNumber, trackingUrl };
}

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    rateLimit(req, { limit: 30, windowMs: 60_000, scope: 'order-status' });

    const db = getDb();
    const token = await authenticate(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    const orderId = cleanText(body.orderId, 128);
    if (!orderId) throw new HttpError(400, 'Missing order id.');

    const action = cleanText(body.action || 'status', 20);
    if (!['status', 'cancel', 'tracking'].includes(action)) {
      throw new HttpError(400, 'Unknown order action.');
    }

    const result = await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) throw new HttpError(404, 'Order not found.');

      const order = orderSnap.data() || {};
      const currentStatus = String(order.status || 'pending');

      const userSnap = await transaction.get(db.collection('users').doc(token.uid));
      const role = userSnap.exists ? String(userSnap.data().role || 'customer') : 'customer';
      const isAdmin = role === 'admin';
      const isCustomer = order.customerId === token.uid;
      const vendorIds = Array.isArray(order.vendorIds) ? order.vendorIds : [];
      const isVendor = vendorIds.includes(token.uid);

      if (!isAdmin && !isCustomer && !isVendor) {
        throw new HttpError(403, 'You do not have access to this order.');
      }

      // ---- resolve the target status ----
      let target;
      if (action === 'cancel') {
        if (isAdmin) {
          target = 'cancelled';
        } else if (isCustomer) {
          if (!CUSTOMER_CANCELLABLE.has(currentStatus)) {
            throw new HttpError(409, 'This order can no longer be cancelled. Please contact support.');
          }
          target = 'cancelled';
        } else {
          // A vendor may only cancel an order that is entirely theirs.
          if (vendorIds.length > 1 || vendorIds[0] !== token.uid) {
            throw new HttpError(403, 'A multi-vendor order can only be cancelled by an admin.');
          }
          if (!CUSTOMER_CANCELLABLE.has(currentStatus)) {
            throw new HttpError(409, 'This order can no longer be cancelled.');
          }
          target = 'cancelled';
        }
      } else {
        target = cleanText(body.status, 32) || (action === 'tracking' ? currentStatus : '');
        if (!ADMIN_STATUSES.includes(target)) {
          throw new HttpError(400, 'Invalid order status.');
        }
        if (!isAdmin && target !== currentStatus) {
          if (!isVendor) throw new HttpError(403, 'Only the vendor can update fulfilment.');
          const allowed = VENDOR_TRANSITIONS[currentStatus] || [];
          if (!allowed.includes(target)) {
            throw new HttpError(409, `Cannot move an order from "${currentStatus}" to "${target}".`);
          }
        }
      }

      const { trackingNumber, trackingUrl } = sanitizeTracking(body);
      if ((trackingNumber || trackingUrl) && !isAdmin && !isVendor) {
        throw new HttpError(403, 'Only the seller can add tracking information.');
      }

      // No-op (idempotent retries): same status and nothing else to write.
      if (target === currentStatus && !trackingNumber && !trackingUrl) {
        return { orderId, status: currentStatus, changed: false };
      }

      // ---- reads needed before any write (Firestore transaction rule) ----
      const items = Array.isArray(order.items) ? order.items : [];
      const shouldRestock =
        RESTOCK_STATUSES.has(target) && !order.stockRestored && currentStatus !== target;

      const productRefs = shouldRestock
        ? items.map((item) => db.collection('products').doc(String(item.productId || '')))
        : [];
      const productSnaps = productRefs.length ? await transaction.getAll(...productRefs) : [];

      const vendorRefs = shouldRestock
        ? vendorIds.map((id) => db.collection('vendors').doc(id))
        : [];
      const vendorSnaps = vendorRefs.length ? await transaction.getAll(...vendorRefs) : [];

      let couponSnap = null;
      const couponRef =
        shouldRestock && order.couponId
          ? db.collection('coupons').doc(String(order.couponId))
          : null;
      if (couponRef) couponSnap = await transaction.get(couponRef);

      // ---- writes ----
      const now = FieldValue.serverTimestamp();
      const auditEntry = {
        status: target,
        from: currentStatus,
        at: new Date().toISOString(),
        by: token.uid,
        role: isAdmin ? 'admin' : isVendor ? 'vendor' : 'customer',
        note: cleanText(body.note, 300) || null,
      };

      const updates = {
        status: target,
        updatedAt: now,
        statusHistory: FieldValue.arrayUnion(auditEntry),
      };
      if (trackingNumber) updates.trackingNumber = trackingNumber;
      if (trackingUrl) updates.trackingUrl = trackingUrl;
      if (trackingNumber || trackingUrl) updates.shippedAt = order.shippedAt || new Date().toISOString();

      if (target === 'cancelled') {
        updates.cancelledAt = new Date().toISOString();
        updates.cancelledBy = isAdmin ? 'admin' : isVendor ? 'vendor' : 'customer';
      }
      if (RESTOCK_STATUSES.has(target) && order.paymentStatus === 'verified') {
        // Money was received: flag it so an admin can complete the refund.
        updates.refundStatus = order.refundStatus || 'pending';
      }

      if (shouldRestock) {
        items.forEach((item, index) => {
          const snap = productSnaps[index];
          if (!snap || !snap.exists) return;
          const quantity = Math.max(0, Math.trunc(Number(item.quantity) || 0));
          if (!quantity) return;
          transaction.update(productRefs[index], {
            stock: FieldValue.increment(quantity),
            soldCount: FieldValue.increment(-quantity),
            updatedAt: now,
          });
        });

        vendorSnaps.forEach((snap, index) => {
          if (!snap || !snap.exists) return;
          const vendorId = vendorIds[index];
          const vendorItems = items.filter((item) => item.vendorId === vendorId);
          const units = vendorItems.reduce(
            (sum, item) => sum + Math.max(0, Math.trunc(Number(item.quantity) || 0)),
            0
          );
          const revenue = vendorItems.reduce(
            (sum, item) =>
              sum +
              (Number(item.price) || 0) * (Number(item.quantity) || 0) +
              (Number(item.addonTotal) || 0),
            0
          );
          transaction.update(vendorRefs[index], {
            totalSales: FieldValue.increment(-units),
            totalRevenue: FieldValue.increment(-Math.round(revenue * 100) / 100),
            updatedAt: now,
          });
        });

        if (couponRef && couponSnap && couponSnap.exists) {
          const usedCount = Number(couponSnap.data().usedCount) || 0;
          if (usedCount > 0) {
            transaction.update(couponRef, {
              usedCount: FieldValue.increment(-1),
              updatedAt: now,
            });
          }
        }

        updates.stockRestored = true;
      }

      transaction.update(orderRef, updates);

      return { orderId, status: target, changed: true, stockRestored: shouldRestock };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) {
      console.error('[order-status] failed:', err?.message);
      await ops.notifyOps({
        level: 'error',
        source: 'order-status',
        title: 'Order update failed (HTTP 500)',
        detail: ops.summarizeError(err),
      });
    }
    return res.status(status).json({
      error: status >= 500 ? 'Could not update the order. Please try again.' : err.message,
    });
  }
};
