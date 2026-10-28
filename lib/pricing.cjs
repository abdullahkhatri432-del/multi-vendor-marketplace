// Server-authoritative pricing. Mirrors src/config/pricing.js — keep both in sync.
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 49;
const TAX_RATE = 0.18;

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

module.exports = { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, TAX_RATE, round2 };
