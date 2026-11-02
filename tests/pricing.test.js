import test from 'node:test';
import assert from 'node:assert/strict';

import { computeTotals, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, TAX_RATE } from '../src/config/pricing.js';

test('orders under the free-shipping threshold pay shipping', () => {
  const totals = computeTotals(500);
  assert.equal(totals.subtotal, 500);
  assert.equal(totals.shipping, SHIPPING_FEE);
  assert.equal(totals.tax, 90);
  assert.equal(totals.total, 639);
});

test('orders above the free-shipping threshold ship free', () => {
  const totals = computeTotals(FREE_SHIPPING_THRESHOLD + 1);
  assert.equal(totals.shipping, 0);
});

test('discounts are capped at the subtotal and never go negative', () => {
  const totals = computeTotals(100, 500);
  assert.equal(totals.discount, 100);
  assert.equal(totals.subtotalAfterDiscount, 0);
  assert.equal(totals.total, SHIPPING_FEE);

  const negative = computeTotals(100, -50);
  assert.equal(negative.discount, 0);
});

test('tax uses the configured rate on the discounted subtotal', () => {
  const totals = computeTotals(1000, 100);
  assert.equal(totals.subtotalAfterDiscount, 900);
  assert.equal(totals.tax, Math.round(900 * TAX_RATE * 100) / 100);
});
