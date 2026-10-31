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

test('manual transfer requires proof and does not claim a UTR', async () => {
  const res = await call({
    ...baseBody,
    paymentMethod: 'manual',
    paymentProofUrl: 'https://example.com/proof.png',
    paymentProofNote: 'Paid via PhonePe',
  });

  assert.equal(res.statusCode, 200);
  assert.equal(findWrite('utrs', 'set'), undefined);
  const order = findWrite('orders', 'set');
  assert.equal(order.data.paymentMethod, 'manual');
  assert.equal(order.data.paymentDetails.proofUrl, 'https://example.com/proof.png');
});

test('manual transfer without proof is rejected', async () => {
  const res = await call({ ...baseBody, paymentMethod: 'manual' });
  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error, /proof/i);
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
