import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeCouponCode,
  isValidCouponCode,
  getCouponStatus,
  computeDiscount,
  normalizeCoupon,
} from '../src/utils/coupons.js';

test('coupon codes are normalised and validated', () => {
  assert.equal(normalizeCouponCode(' save10 '), 'SAVE10');
  assert.equal(isValidCouponCode('save10'), true);
  assert.equal(isValidCouponCode('a'), false);
  assert.equal(isValidCouponCode('bad code!'), false);
});

test('expired, inactive and used-up coupons are invalid', () => {
  assert.deepEqual(getCouponStatus({ active: false }, 1000), { valid: false, reason: 'inactive' });
  assert.equal(
    getCouponStatus({ expiresAt: new Date(Date.now() - 60_000) }, 1000).reason,
    'expired'
  );
  assert.equal(getCouponStatus({ usageLimit: 5, usedCount: 5 }, 1000).reason, 'used-up');
  assert.equal(getCouponStatus({ minOrder: 500 }, 100).reason, 'min-order');
  assert.equal(getCouponStatus({ minOrder: 500 }, 600).valid, true);
});

test('percentage discounts respect the maximum cap', () => {
  const discount = computeDiscount({ type: 'percent', value: 20, maxDiscount: 100 }, 1000);
  assert.equal(discount, 100);
});

test('fixed discounts cannot exceed the subtotal', () => {
  assert.equal(computeDiscount({ type: 'fixed', value: 500 }, 300), 300);
});

test('invalid coupons never produce a discount', () => {
  assert.equal(computeDiscount({ type: 'percent', value: 50, active: false }, 1000), 0);
  assert.equal(computeDiscount(null, 1000), 0);
});

test('normalizeCoupon coerces stored fields', () => {
  const coupon = normalizeCoupon({ code: ' save10 ', usedCount: '3' });
  assert.equal(coupon.code, 'SAVE10');
  assert.equal(coupon.usedCount, 3);
  assert.equal(coupon.active, true);
});
