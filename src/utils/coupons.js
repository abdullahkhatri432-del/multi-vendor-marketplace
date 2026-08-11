// Coupon validation + discount math (pure, testable).
// Coupon shape:
// {
//   code, type: 'percent'|'fixed', value,
//   minOrder (optional), maxDiscount (optional, percent only),
//   active (default true), expiresAt (optional timestamp/ISO),
//   usageLimit (optional), usedCount (default 0)
// }

export const normalizeCouponCode = (code) =>
  String(code || '').trim().toUpperCase();

export const isValidCouponCode = (code) =>
  /^[A-Z0-9_-]{3,20}$/.test(normalizeCouponCode(code));

export const getCouponStatus = (coupon, subtotal) => {
  if (!coupon) return { valid: false, reason: 'not-found' };
  if (coupon.active === false) return { valid: false, reason: 'inactive' };

  if (coupon.expiresAt) {
    const exp = coupon.expiresAt instanceof Date
      ? coupon.expiresAt.getTime()
      : typeof coupon.expiresAt === 'number'
        ? coupon.expiresAt
        : new Date(coupon.expiresAt).getTime();
    if (Number.isFinite(exp) && exp < Date.now()) {
      return { valid: false, reason: 'expired' };
    }
  }

  if (coupon.usageLimit != null && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return { valid: false, reason: 'used-up' };
  }

  if (coupon.minOrder != null && subtotal < coupon.minOrder) {
    return { valid: false, reason: 'min-order', minOrder: coupon.minOrder };
  }

  return { valid: true };
};

export const computeDiscount = (coupon, subtotal) => {
  if (!coupon) return 0;
  const status = getCouponStatus(coupon, subtotal);
  if (!status.valid) return 0;

  const subtotalNum = Math.max(0, Number(subtotal) || 0);
  let discount = 0;

  if (coupon.type === 'percent') {
    discount = subtotalNum * (Number(coupon.value) / 100);
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  } else if (coupon.type === 'fixed') {
    discount = Number(coupon.value) || 0;
  }

  discount = Math.max(0, Math.round(discount * 100) / 100);
  return Math.min(discount, subtotalNum);
};

// Create a display-ready coupon object from a stored one
export const normalizeCoupon = (raw) => {
  if (!raw) return null;
  return {
    ...raw,
    code: normalizeCouponCode(raw.code),
    usedCount: Number(raw.usedCount) || 0,
    active: raw.active !== false,
  };
};
