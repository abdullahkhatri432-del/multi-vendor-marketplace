import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeUtr,
  isValidUtrFormat,
  normalizeAmount,
  parseUtrLines,
  matchPayments,
  matchFromPaste,
} from '../src/utils/paymentMatch.js';

test('UTRs are normalised and format-checked', () => {
  assert.equal(normalizeUtr(' 4123 4567-8901 '), '412345678901');
  assert.equal(isValidUtrFormat('412345678901'), true);
  assert.equal(isValidUtrFormat('4123'), false);
  assert.equal(isValidUtrFormat('ABCDEFGHIJKL'), false);
});

test('amounts are parsed to two decimals', () => {
  assert.equal(normalizeAmount('₹1,499.00'), 1499);
  assert.equal(normalizeAmount('abc'), null);
});

test('pasted bank lines are parsed into UTR + amount entries', () => {
  const entries = parseUtrLines('412345678901 1499\nNEFT 412345678902 Rs 2499.00');
  assert.equal(entries.length, 2);
  assert.deepEqual(
    entries.map((e) => [e.utr, e.amount]),
    [
      ['412345678901', 1499],
      ['412345678902', 2499],
    ]
  );
});

test('matching requires the UTR and, when present, the amount', () => {
  const orders = [
    { id: 'o1', paymentReference: '412345678901', total: 1499, paymentStatus: 'pending-verification' },
    { id: 'o2', paymentReference: '412345678902', total: 500, paymentStatus: 'pending-verification' },
    { id: 'o3', paymentReference: '412345678903', total: 999, paymentStatus: 'verified' },
  ];
  const { matched, unmatched } = matchPayments(orders, [
    { utr: '412345678901', amount: 1499 },
    { utr: '412345678902', amount: 800 },
  ]);

  assert.equal(matched.length, 2);
  assert.equal(matched[0].amountMatches, true);
  assert.equal(matched[1].amountMatches, false);
  assert.equal(unmatched.length, 0);
});

test('verified orders are never re-matched', () => {
  const orders = [{ id: 'o1', paymentReference: '412345678903', total: 999, paymentStatus: 'verified' }];
  const { matched } = matchFromPaste(orders, '412345678903 999');
  assert.equal(matched.length, 0);
});

test('COD orders match against the advance amount', () => {
  const orders = [
    {
      id: 'o1',
      paymentReference: '412345678904',
      total: 2000,
      advanceAmount: 499,
      paymentMethod: 'cod',
      paymentStatus: 'pending-verification',
    },
  ];
  const { matched } = matchFromPaste(orders, '412345678904 499');
  assert.equal(matched[0].amountMatches, true);
});
