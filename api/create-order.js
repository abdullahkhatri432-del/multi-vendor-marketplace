// Creates an order server-side.
//
// Why: the browser must never be trusted with prices, stock or payment state.
// This endpoint verifies the Firebase ID token, re-reads every product and
// coupon from Firestore, recomputes the totals, atomically reserves the UPI
// reference, decrements stock and writes the order.
const crypto = require('crypto');
const {
  HttpError,
  getDb,
  authenticate,
  applyCors,
  rateLimit,
  FieldValue,
} = require('../lib/http.cjs');
const {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  TAX_RATE,
  round2,
} = require('../lib/pricing.cjs');

const UPI_ID = process.env.UPI_ID || '8160587811@kotak811';
const MAX_ITEMS = 50;
const MAX_QTY = 99;

const normalizeUtr = (raw) =>
  String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const isValidUtr = (utr) => utr.length >= 12 && utr.length <= 22 && /^[0-9]/.test(utr);

const hashUtr = (utr) => crypto.createHash('sha256').update(utr).digest('hex');

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

function sanitizeAddress(input) {
  const source = input && typeof input === 'object' ? input : {};
  const pick = (key, max) => String(source[key] || '').trim().slice(0, max);
  const address = {
    address: pick('address', 300),
    city: pick('city', 120),
    state: pick('state', 120),
    zip: pick('zip', 20),
    country: pick('country', 80) || 'IN',
  };
  if (!address.address || !address.city || !address.state || !address.zip) {
    throw new HttpError(400, 'Please complete your shipping address.');
  }
  return address;
}

function normalizeItems(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new HttpError(400, 'Your cart is empty.');
  }
  if (input.length > MAX_ITEMS) {
    throw new HttpError(400, 'Too many items in one order.');
  }

  const merged = new Map();
  for (const raw of input) {
    const productId = String(raw?.productId || raw?.id || '').trim();
    if (!productId) throw new HttpError(400, 'Invalid item in cart.');

    const quantity = Math.trunc(Number(raw?.quantity) || 1);
    if (quantity < 1 || quantity > MAX_QTY) {
      throw new HttpError(400, 'Invalid quantity in cart.');
    }
    const addons = Array.isArray(raw?.addons)
      ? raw.addons.map((a) => String(a?.id || a?.title || '')).filter(Boolean).slice(0, 10)
      : [];

    const key = `${productId}::${addons.sort().join('|')}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(MAX_QTY, existing.quantity + quantity);
    } else {
      merged.set(key, { productId, quantity, addonKeys: addons });
    }
  }
  return [...merged.values()];
}

function buildCouponDiscount(coupon, subtotal) {
  if (!coupon) return { discount: 0 };

  if (coupon.active === false) throw new HttpError(409, 'This coupon is no longer available.');
  const expiresAt = toDate(coupon.expiresAt);
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    throw new HttpError(409, 'This coupon has expired.');
  }
  if (coupon.usageLimit != null && (coupon.usedCount || 0) >= coupon.usageLimit) {
    throw new HttpError(409, 'This coupon has reached its usage limit.');
  }
  if (coupon.minOrder != null && subtotal < Number(coupon.minOrder)) {
    throw new HttpError(
      409,
      `This coupon requires a minimum order of ₹${Number(coupon.minOrder).toFixed(2)}.`
    );
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = subtotal * (Number(coupon.value) / 100);
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  } else if (coupon.type === 'fixed') {
    discount = Number(coupon.value) || 0;
  }

  return { discount: Math.min(Math.max(0, round2(discount)), subtotal) };
}

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    rateLimit(req, { limit: 20, windowMs: 60_000, scope: 'create-order' });

    const db = getDb();
    const token = await authenticate(req);

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const items = normalizeItems(body.items);
    const shippingAddress = sanitizeAddress(body.shippingAddress);

    const customerName = String(body.customerName || token.name || '').trim().slice(0, 120);
    const customerEmail = String(body.customerEmail || token.email || '').trim().slice(0, 254);
    if (!customerName) throw new HttpError(400, 'Please provide your full name.');

    const paymentMethod = String(body.paymentMethod || '').trim();
    if (paymentMethod === 'card') {
      throw new HttpError(400, 'Card payments are not available yet. Please use UPI or Cash on Delivery.');
    }
    if (!['upi', 'cod'].includes(paymentMethod)) {
      throw new HttpError(400, 'Please choose a valid payment method.');
    }

    const utr = normalizeUtr(body.utr || body.paymentReference);
    if (!isValidUtr(utr)) {
      throw new HttpError(400, 'Please enter a valid UPI transaction reference (12–22 characters starting with a digit).');
    }

    const couponCode = String(body.couponCode || '').trim().toUpperCase().slice(0, 40);

    const result = await db.runTransaction(async (transaction) => {
      // ---------- reads ----------
      const productRefs = items.map((item) => db.collection('products').doc(item.productId));
      const productSnaps = await transaction.getAll(...productRefs);

      const orderItems = [];
      const stockUpdates = [];
      let subtotal = 0;

      items.forEach((item, index) => {
        const snap = productSnaps[index];
        if (!snap.exists) {
          throw new HttpError(409, 'One of the items is no longer available.');
        }
        const product = snap.data();
        if (product.active === false) {
          throw new HttpError(409, `"${product.name || 'An item'}" is no longer available.`);
        }
        if (typeof product.stock === 'number' && product.stock < item.quantity) {
          throw new HttpError(
            409,
            product.stock <= 0
              ? `"${product.name}" is out of stock.`
              : `Only ${product.stock} left of "${product.name}".`
          );
        }

        const price = round2(product.price);
        if (!Number.isFinite(price) || price < 0) {
          throw new HttpError(409, `"${product.name}" has an invalid price.`);
        }

        const catalogAddons = Array.isArray(product.addons) ? product.addons : [];
        const selectedAddons = [];
        for (const key of item.addonKeys) {
          const match = catalogAddons.find((addon, addonIndex) => {
            const id = String(addon?.id || `addon-${addonIndex}`);
            return id === key || String(addon?.title || '') === key;
          });
          if (!match) {
            throw new HttpError(409, 'One of the selected add-ons is no longer available.');
          }
          selectedAddons.push({
            id: String(match.id || `addon-${catalogAddons.indexOf(match)}`),
            title: String(match.title || '').slice(0, 120),
            price: round2(match.price || 0),
          });
        }

        const addonUnitTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
        const addonTotal = round2(addonUnitTotal * item.quantity);
        const lineTotal = round2(price * item.quantity + addonTotal);
        subtotal = round2(subtotal + lineTotal);

        orderItems.push({
          productId: item.productId,
          name: String(product.name || 'Item').slice(0, 200),
          price,
          quantity: item.quantity,
          image: product.images?.[0] || product.image || '',
          vendorId: product.vendorId || null,
          vendorName: product.vendorName || '',
          addons: selectedAddons,
          addonTotal,
        });

        stockUpdates.push({
          ref: productRefs[index],
          quantity: item.quantity,
          productName: product.name,
          stock: typeof product.stock === 'number' ? product.stock : null,
        });
      });

      // Coupon
      let coupon = null;
      let couponRef = null;
      if (couponCode) {
        const couponQuery = db.collection('coupons').where('code', '==', couponCode).limit(1);
        const couponSnap = await transaction.get(couponQuery);
        if (couponSnap.empty) {
          throw new HttpError(409, 'This coupon is no longer valid.');
        }
        couponRef = couponSnap.docs[0].ref;
        coupon = couponSnap.docs[0].data();
      }
      const { discount } = coupon ? buildCouponDiscount(coupon, subtotal) : { discount: 0 };
      const subtotalAfterDiscount = round2(subtotal - discount);
      const shipping = subtotalAfterDiscount > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      const tax = round2(subtotalAfterDiscount * TAX_RATE);
      const total = round2(subtotalAfterDiscount + shipping + tax);

      const advanceAmount =
        paymentMethod === 'cod' ? Math.min(total, Math.max(499, Math.round(total * 0.2))) : null;
      const balanceDue = paymentMethod === 'cod' ? round2(total - advanceAmount) : null;

      const vendorIds = [...new Set(orderItems.map((item) => item.vendorId).filter(Boolean))];
      const vendorRefs = vendorIds.map((id) => db.collection('vendors').doc(id));
      const vendorSnaps = vendorRefs.length ? await transaction.getAll(...vendorRefs) : [];

      // UPI reference uniqueness
      const utrRef = db.collection('utrs').doc(hashUtr(utr));
      const utrSnap = await transaction.get(utrRef);
      if (utrSnap.exists) {
        const claim = utrSnap.data() || {};
        if (claim.customerId !== token.uid || claim.orderId != null) {
          throw new HttpError(
            409,
            'This UPI reference has already been used. If you were charged, please check My Orders before retrying.'
          );
        }
      }

      // ---------- writes ----------
      const orderRef = db.collection('orders').doc();
      const now = FieldValue.serverTimestamp();

      // set() rather than create(): the Admin SDK's transaction.create() rejects
      // FieldValue transforms (e.g. serverTimestamp) when serializing. `orderRef`
      // is a fresh random id, so there is nothing to guard against anyway.
      transaction.set(orderRef, {
        customerId: token.uid,
        customerName,
        customerEmail,
        shippingAddress,
        items: orderItems,
        vendorIds,
        subtotal,
        discount,
        couponCode: coupon ? couponCode : null,
        couponId: couponRef ? couponRef.id : null,
        shipping,
        tax,
        taxRate: TAX_RATE,
        total,
        paymentMethod,
        paymentStatus: 'pending-verification',
        paymentReference: utr,
        paymentDetails: {
          upiId: UPI_ID,
          transactionRef: utr,
          confirmedAt: new Date().toISOString(),
        },
        ...(paymentMethod === 'cod'
          ? {
              advanceAmount,
              balanceDue,
              paymentNote: `₹${advanceAmount.toFixed(2)} advance paid (UTR ${utr}), ₹${balanceDue.toFixed(2)} payable on delivery`,
            }
          : {}),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      transaction.set(utrRef, {
        utr,
        customerId: token.uid,
        orderId: orderRef.id,
        pending: false,
        createdAt: now,
        updatedAt: now,
      });

      for (const update of stockUpdates) {
        const data = {
          soldCount: FieldValue.increment(update.quantity),
          updatedAt: now,
        };
        if (update.stock != null) data.stock = update.stock - update.quantity;
        transaction.update(update.ref, data);
      }

      vendorSnaps.forEach((snap, index) => {
        if (!snap.exists) return;
        const vendorId = vendorIds[index];
        const units = orderItems
          .filter((item) => item.vendorId === vendorId)
          .reduce((sum, item) => sum + item.quantity, 0);
        const revenue = orderItems
          .filter((item) => item.vendorId === vendorId)
          .reduce((sum, item) => sum + item.price * item.quantity + item.addonTotal, 0);
        transaction.update(vendorRefs[index], {
          totalSales: FieldValue.increment(units),
          totalRevenue: FieldValue.increment(round2(revenue)),
          updatedAt: now,
        });
      });

      if (couponRef) {
        transaction.update(couponRef, {
          usedCount: FieldValue.increment(1),
          updatedAt: now,
        });
      }

      return {
        orderId: orderRef.id,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        advanceAmount,
        balanceDue,
      };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) {
      console.error('[create-order] failed:', err?.message);
    }
    return res.status(status).json({
      error: status >= 500 ? 'Could not place your order. Please try again.' : err.message,
    });
  }
};
