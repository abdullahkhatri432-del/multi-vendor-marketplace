/**
 * Indian currency formatting used across the storefront.
 *
 * `inr(24999)`     -> "₹24,999"
 * `inr(149.5)`     -> "₹149.50"
 * `inr(0)`         -> "₹0"
 */
export const inr = (value) => {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

export default inr;
