// Order creation must be server-authoritative: prices, discounts, stock and
// payment references are all recomputed from Firestore. These tests run the real
// api/create-order.js handler with Firestore mocked, so a regression in the
// write phase (like the utrRef scope bug) fails the suite.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const root = path.join(__dirname, '..');
const httpPath = require.resolve(path.join(root, 'lib', 'http.cjs'));
const pricingPath = require.resolve(path.join(root, 'lib', 'pricing.cjs'));
const handlerPath = require.resolve(path.join(root, 'api', 'create-order.js'));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---- controllable fake Firestore -------------------------------------------
const state = {
  product: {
    name: 'Widget',
    price: 100,
    stock: 10,
    active: true,
    vendorId: 'v1',
    vendorName: 'Vendor One',
    addons: [],
  },
  utrClaim: null,
  writes: [],
};

let refCounter = 0;
const makeRef = (collectionName, id) => ({
  collectionName,
  id: id || `${collectionName}-${refCounter++}`,
  get path() {
    return `${collectionName}/${this.id}`;
  },
});

const db = {
  collection(name) {
    return {
      doc(id) {
        return makeRef(name, id);
      },
      where() {
        return {
          limit() {
            return { __query: 'coupon', collection: name };
          },
        };
      },
    };
  },
  async runTransaction(fn) {
    const tx = {
      async getAll(...items) {
        return items.map((ref) =>
          ref.collectionName === 'products'
            ? { exists: true, data: () => ({ ...state.product }) }
            : { exists: false, data: () => ({}) }
        );
      },
      async get(ref) {
        if (ref && ref.__query === 'coupon') return { empty: true, docs: [] };
        if (ref && ref.collectionName === 'utrs' && state.utrClaim) {
          return { exists: true, data: () => ({ ...state.utrClaim }) };
        }
        if (ref && ref.collectionName === 'orders' && state.existingOrder) {
          return {
            exists: true,
            id: 'order-9',
            data: () => ({ ...state.existingOrder }),
          };
        }
        return { exists: false, data: () => ({}) };
      },
      set(ref, data) {
        state.writes.push({ op: 'set', ref, data });
      },
      update(ref, data) {
        state.writes.push({ op: 'update', ref, data });
      },
    };
    return fn(tx);
  },
};

require.cache[httpPath] = new Module(httpPath, null);
Object.assign(require.cache[httpPath], {
  filename: httpPath,
  loaded: true,
  exports: {
    HttpError,
    getDb: () => db,
    authenticate: async () => ({ uid: 'u1', email: 'buyer@example.com', name: 'Buyer' }),
    applyCors: () => {},
    rateLimit: () => {},
    FieldValue: {
      serverTimestamp: () => ({ __ts: true }),
      increment: (n) => ({ __inc: n }),
    },
  },
});

require.cache[pricingPath] = new Module(pricingPath, null);
Object.assign(require.cache[pricingPath], {
  filename: pricingPath,
  loaded: true,
  exports: {
    FREE_SHIPPING_THRESHOLD: 999,
    SHIPPING_FEE: 49,
    TAX_RATE: 0.18,
    round2: (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100,
  },
});

const handler = require(handlerPath);

const baseBody = {
  customerName: 'Buyer',
  customerEmail: 'buyer@example.com',
  shippingAddress: { address: '1 Road', city: 'Pune', state: 'MH', zip: '411001', country: 'IN' },
  items: [{ productId: 'p1', quantity: 2, addons: [] }],
};

async function call(body) {
  state.writes.length = 0;
  const res = {
    statusCode: 0,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    end() {
      return this;
    },
  };
  await handler({ method: 'POST', headers: {}, body }, res);
  return res;
}

const findWrite = (collection, op) =>
  state.writes.find((w) => w.ref.collectionName === collection && (!op || w.op === op));

test.beforeEach(() => {
  state.product = {
    name: 'Widget',
    price: 100,
    stock: 10,
    active: true,
    vendorId: 'v1',
    vendorName: 'Vendor One',
    addons: [],
  };
  state.utrClaim = null;
  state.existingOrder = null;
  refCounter = 0;
});

test('UPI order is priced on the server and reserves the UTR', async () => {
  const res = await call({ ...baseBody, paymentMethod: 'upi', utr: '412345678901' });

  assert.equal(res.statusCode, 200);
  // 2 x 100 = 200 subtotal; under the 999 threshold so shipping applies.
  assert.equal(res.payload.subtotal, 200);
  assert.equal(res.payload.shipping, 49);
  assert.equal(res.payload.tax, 36);
  assert.equal(res.payload.total, 285);

  const order = findWrite('orders', 'set');
  assert.ok(order, 'order document written');
  assert.equal(order.data.paymentMethod, 'upi');
  assert.equal(order.data.paymentStatus, 'pending-verification');
  assert.equal(order.data.paymentReference, '412345678901');

  const claim = findWrite('utrs', 'set');
  assert.ok(claim, 'UTR claim written');
  assert.equal(claim.data.utr, '412345678901');

  const stockUpdate = findWrite('products', 'update');
  assert.equal(stockUpdate.data.stock, 8);
});

test('client-supplied prices are ignored', async () => {
  const res = await call({
    ...baseBody,
    items: [{ productId: 'p1', quantity: 2, price: 1, addons: [] }],
    paymentMethod: 'upi',
    utr: '412345678901',
    subtotal: 2,
    total: 2,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.total, 285);
});

test('COD order records the advance and the balance due', async () => {
  const res = await call({ ...baseBody, paymentMethod: 'cod', utr: '412345678902' });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.advanceAmount, 285);
  assert.equal(res.payload.balanceDue, 0);

  const order = findWrite('orders', 'set');
  assert.equal(order.data.paymentMethod, 'cod');
  assert.equal(order.data.balanceDue, 0);
});

test('manual transfer is rejected because the method was removed', async () => {
  const res = await call({
    ...baseBody,
    paymentMethod: 'manual',
    paymentProofUrl: 'https://example.com/proof.png',
    paymentProofNote: 'Paid via PhonePe',
  });

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error, /valid payment method/i);
  assert.equal(state.writes.length, 0);
});

test('card payments are rejected with a clear message', async () => {
  const res = await call({ ...baseBody, paymentMethod: 'card' });
  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error, /not available yet/i);
});

test('invalid UTR format is rejected before any write', async () => {
  const res = await call({ ...baseBody, paymentMethod: 'upi', utr: 'abc' });
  assert.equal(res.statusCode, 400);
  assert.equal(state.writes.length, 0);
});

test('out-of-stock products cannot be ordered', async () => {
  state.product.stock = 0;
  const res = await call({ ...baseBody, paymentMethod: 'upi', utr: '412345678901' });
  assert.equal(res.statusCode, 409);
  assert.match(res.payload.error, /out of stock/i);
  assert.equal(findWrite('orders'), undefined);
});

test('quantity above available stock is rejected', async () => {
  state.product.stock = 1;
  const res = await call({ ...baseBody, paymentMethod: 'upi', utr: '412345678901' });
  assert.equal(res.statusCode, 409);
  assert.match(res.payload.error, /Only 1 left/i);
});

test('a UTR already claimed by another customer is rejected', async () => {
  state.utrClaim = { customerId: 'someone-else', orderId: 'order-9' };
  const res = await call({ ...baseBody, paymentMethod: 'upi', utr: '412345678901' });
  assert.equal(res.statusCode, 409);
  assert.match(res.payload.error, /already been used/i);
});

test('resubmitting the same reference returns the order created by the first attempt', async () => {
  state.utrClaim = { customerId: 'u1', orderId: 'order-9' };
  state.existingOrder = {
    status: 'pending',
    subtotal: 200,
    discount: 0,
    shipping: 49,
    tax: 36,
    total: 285,
  };

  const res = await call({ ...baseBody, paymentMethod: 'upi', utr: '412345678901' });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.duplicate, true);
  assert.equal(res.payload.orderId, 'order-9');
  assert.equal(res.payload.total, 285);
  assert.equal(state.writes.length, 0, 'no second order or stock write');
});

test('a reference belonging to a cancelled order is not reused', async () => {
  state.utrClaim = { customerId: 'u1', orderId: 'order-9' };
  state.existingOrder = { status: 'cancelled', total: 285 };

  const res = await call({ ...baseBody, paymentMethod: 'upi', utr: '412345678901' });

  assert.equal(res.statusCode, 409);
  assert.match(res.payload.error, /cancelled order/i);
});

test('the same product on two lines is validated and decremented once', async () => {
  state.product.addons = [{ id: 'gift', title: 'Gift wrap', price: 10 }];

  // 4 + 4 = 8 units against a stock of 10 must succeed and write one update.
  const ok = await call({
    ...baseBody,
    items: [
      { productId: 'p1', quantity: 4, addons: [] },
      { productId: 'p1', quantity: 4, addons: [{ id: 'gift', title: 'Gift wrap' }] },
    ],
    paymentMethod: 'upi',
    utr: '412345678903',
  });
  assert.equal(ok.statusCode, 200);
  const updates = state.writes.filter((w) => w.ref.collectionName === 'products');
  assert.equal(updates.length, 1);
  assert.equal(updates[0].data.stock, 2);

  // 6 + 6 = 12 against a stock of 10 must be rejected, not silently oversold.
  const over = await call({
    ...baseBody,
    items: [
      { productId: 'p1', quantity: 6, addons: [] },
      { productId: 'p1', quantity: 6, addons: [] },
    ],
    paymentMethod: 'upi',
    utr: '412345678904',
  });
  assert.equal(over.statusCode, 409);
  assert.match(over.payload.error, /Only 10 left/i);
});

test('inline data-URL product photos are not copied into the order', async () => {
  state.product.images = ['data:image/webp;base64,AAAA'];
  const res = await call({ ...baseBody, paymentMethod: 'upi', utr: '412345678905' });
  assert.equal(res.statusCode, 200);
  const order = findWrite('orders', 'set');
  assert.equal(order.data.items[0].image, '');
});

test('remote product photos are kept on the order', async () => {
  state.product.images = ['https://cdn.example.com/widget.webp'];
  const res = await call({ ...baseBody, paymentMethod: 'upi', utr: '412345678906' });
  assert.equal(res.statusCode, 200);
  const order = findWrite('orders', 'set');
  assert.equal(order.data.items[0].image, 'https://cdn.example.com/widget.webp');
});

test('an incomplete shipping address is rejected', async () => {
  const res = await call({
    ...baseBody,
    shippingAddress: { address: '1 Road', city: '', state: 'MH', zip: '411001' },
    paymentMethod: 'upi',
    utr: '412345678901',
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error, /shipping address/i);
});

test('non-POST methods are rejected', async () => {
  const res = {
    statusCode: 0,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    end() {},
  };
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 405);
});
