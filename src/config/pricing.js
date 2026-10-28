// Client-side mirror of lib/pricing.cjs. Keep both in sync.
// These values are only used to preview totals in the UI — the server
// recomputes everything in /api/create-order before writing an order.
export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 49;
export const TAX_RATE = 0.18;

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const computeTotals = (subtotal, discount = 0) => {
  const safeSubtotal = Number(subtotal) || 0;
  const safeDiscount = Math.min(Math.max(0, Number(discount) || 0), safeSubtotal);
  const subtotalAfterDiscount = round2(safeSubtotal - safeDiscount);
  const shipping = subtotalAfterDiscount > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = round2(subtotalAfterDiscount * TAX_RATE);
  const total = round2(subtotalAfterDiscount + shipping + tax);
  return { subtotal: round2(safeSubtotal), discount: round2(safeDiscount), subtotalAfterDiscount, shipping, tax, total };
};

// COD requires a small UPI advance to confirm intent. Mirrors the server.
export const computeCodSplit = (total) => {
  const advanceAmount = Math.min(
    Number(total) || 0,
    Math.max(499, Math.round((Number(total) || 0) * 0.2))
  );
  return { advanceAmount, balanceDue: round2((Number(total) || 0) - advanceAmount) };
};
