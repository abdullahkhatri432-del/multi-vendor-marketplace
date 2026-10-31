// Status changes are the second half of the order lifecycle: they must enforce
// role permissions, refuse invalid transitions and restore stock exactly once.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const root = path.join(__dirname, '..');
const httpPath = require.resolve(path.join(root, 'lib', 'http.cjs'));
const handlerPath = require.resolve(path.join(root, 'api', 'order-status.js'));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const state = {
  role: 'customer',
  order: null,
  writes: [],
};

let refCounter = 0;
const makeRef = (collectionName, id) => ({
  collectionName,
  id: id || `${collectionName}-${refCounter++}`,
});

const db = {
  collection(name) {
    return { doc: (id) => makeRef(name, id) };
  },
  async runTransaction(fn) {
    const tx = {
      async get(ref) {
        if (ref.collectionName === 'orders') {
          return state.order
            ? { exists: true, data: () => ({ ...state.order }) }
            : { exists: false, data: () => ({}) };
        }
        if (ref.collectionName === 'users') {
          return { exists: true, data: () => ({ role: state.role }) };
        }
        return { exists: false, data: () => ({}) };
      },
      async getAll(...refs) {
        return refs.map((ref) =>
          ref.collectionName === 'products'
            ? { exists: true, data: () => ({ stock: 3 }) }
            : ref.collectionName === 'vendors'
              ? { exists: true, data: () => ({ totalSales: 10, totalRevenue: 1000 }) }
              : { exists: false, data: () => ({}) }
        );
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
    authenticate: async () => ({ uid: 'u1', name: 'Buyer' }),
    applyCors: () => {},
    rateLimit: () => {},
    FieldValue: {
      serverTimestamp: () => ({ __ts: true }),
      increment: (n) => ({ __inc: n }),
      arrayUnion: (v) => ({ __union: v }),
    },
  },
});

const handler = require(handlerPath);

const baseOrder = {
  customerId: 'u1',
  vendorIds: ['v1'],
  status: 'pending',
  paymentStatus: 'pending-verification',
  items: [{ productId: 'p1', quantity: 2, vendorId: 'v1', price: 100, addonTotal: 0 }],
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
    end() {},
  };
  await handler({ method: 'POST', headers: {}, body }, res);
  return res;
}

test.beforeEach(() => {
  state.role = 'customer';
  state.order = { ...baseOrder, items: baseOrder.items.map((i) => ({ ...i })) };
  refCounter = 0;
});

test('a customer can cancel an unshipped order and stock is restored', async () => {
  const res = await call({ orderId: 'o1', action: 'cancel' });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.status, 'cancelled');
  assert.equal(res.payload.stockRestored, true);

  const orderUpdate = state.writes.find((w) => w.ref.collectionName === 'orders');
  assert.equal(orderUpdate.data.status, 'cancelled');
  assert.equal(orderUpdate.data.stockRestored, true);
  assert.equal(orderUpdate.data.cancelledBy, 'customer');

  const stockUpdate = state.writes.find((w) => w.ref.collectionName === 'products');
  assert.deepEqual(stockUpdate.data.stock, { __inc: 2 });
});

test('a shipped order cannot be cancelled by the customer', async () => {
  state.order.status = 'shipped';
  const res = await call({ orderId: 'o1', action: 'cancel' });
  assert.equal(res.statusCode, 409);
  assert.match(res.payload.error, /can no longer be cancelled/i);
});

test('an unrelated customer cannot touch the order', async () => {
  state.order.customerId = 'someone-else';
  const res = await call({ orderId: 'o1', action: 'cancel' });
  assert.equal(res.statusCode, 403);
});

test('a vendor may only advance through the allowed transitions', async () => {
  state.role = 'vendor';
  state.order.status = 'processing';
  state.order.customerId = 'customer-2';
  state.order.vendorIds = ['u1'];

  const skipped = await call({ orderId: 'o1', action: 'status', status: 'delivered' });
  assert.equal(skipped.statusCode, 409);
  assert.match(skipped.payload.error, /Cannot move an order/i);

  const shipped = await call({ orderId: 'o1', action: 'status', status: 'shipped' });
  assert.equal(shipped.statusCode, 200);
  assert.equal(shipped.payload.status, 'shipped');
});

test('a vendor cannot cancel a multi-vendor order', async () => {
  state.role = 'vendor';
  state.order.customerId = 'customer-2';
  state.order.vendorIds = ['u1', 'v2'];
  const res = await call({ orderId: 'o1', action: 'cancel' });
  assert.equal(res.statusCode, 403);
});

test('admins can set any valid status', async () => {
  state.role = 'admin';
  state.order.status = 'pending';
  const res = await call({ orderId: 'o1', action: 'status', status: 'packed' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.status, 'packed');
});

test('invalid statuses are rejected', async () => {
  state.role = 'admin';
  const res = await call({ orderId: 'o1', action: 'status', status: 'teleported' });
  assert.equal(res.statusCode, 400);
});

test('repeating the same status is an idempotent no-op', async () => {
  state.role = 'vendor';
  state.order.status = 'shipped';
  state.order.customerId = 'customer-2';
  state.order.vendorIds = ['u1'];
  const res = await call({ orderId: 'o1', action: 'status', status: 'shipped' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.changed, false);
  assert.equal(state.writes.length, 0);
});

test('tracking requires the seller role', async () => {
  const res = await call({ orderId: 'o1', action: 'tracking', trackingNumber: 'AWB123' });
  assert.equal(res.statusCode, 403);
});

test('tracking URLs must be http(s)', async () => {
  state.role = 'vendor';
  state.order.customerId = 'customer-2';
  state.order.vendorIds = ['u1'];
  const res = await call({
    orderId: 'o1',
    action: 'tracking',
    trackingNumber: 'AWB123',
    trackingUrl: 'javascript:alert(1)',
  });
  assert.equal(res.statusCode, 400);
});

test('a missing order returns 404', async () => {
  state.order = null;
  const res = await call({ orderId: 'nope', action: 'cancel' });
  assert.equal(res.statusCode, 404);
});
