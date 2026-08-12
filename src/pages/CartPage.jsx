import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Ticket, X, Loader2, AlertCircle, ShieldCheck, Truck, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckoutInterceptor } from '../context/CheckoutInterceptorContext';
import { getCouponByCode } from '../config/firestore';
import { getCouponStatus, computeDiscount, normalizeCoupon, normalizeCouponCode } from '../utils/coupons';
import EmptyState from '../components/ui/EmptyState';

const FREE_SHIPPING_THRESHOLD = 999;

export default function CartPage() {
  const { cart, removeItem, updateQuantity, cartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { intercept } = useCheckoutInterceptor();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const discount = computeDiscount(coupon, cartTotal);
  const subtotalAfterDiscount = cartTotal - discount;
  const shipping = subtotalAfterDiscount > FREE_SHIPPING_THRESHOLD ? 0 : 49;
  const tax = subtotalAfterDiscount * 0.08;
  const total = subtotalAfterDiscount + shipping + tax;
  const savings = discount + (shipping === 0 && cartTotal < FREE_SHIPPING_THRESHOLD ? 49 : 0);

  const handleApplyCoupon = async () => {
    const code = normalizeCouponCode(couponCode);
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      const found = await getCouponByCode(code);
      const normalized = normalizeCoupon(found);
      if (!normalized) {
        setCouponError('Invalid coupon code.');
        return;
      }
      const status = getCouponStatus(normalized, cartTotal);
      if (!status.valid) {
        if (status.reason === 'min-order') {
          setCouponError(`This coupon requires a minimum order of ₹${status.minOrder.toFixed(2)}.`);
        } else if (status.reason === 'expired') {
          setCouponError('This coupon has expired.');
        } else if (status.reason === 'used-up') {
          setCouponError('This coupon has reached its usage limit.');
        } else {
          setCouponError('This coupon is not available.');
        }
        return;
      }
      setCoupon(normalized);
      setCouponCode('');
    } catch (err) {
      console.error('Failed to apply coupon:', err);
      setCouponError('Could not apply coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = async () => {
    try {
      await intercept('checkout');
      navigate('/checkout');
    } catch (err) {
      if (err.message !== 'Authentication cancelled') {
        console.error('Checkout intercept failed:', err);
      }
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added any items to your cart yet. Start shopping to find amazing products!"
          action={() => navigate('/products')}
          actionLabel="Browse Products"
        />
      </div>
    );
  }

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount);
  const progress = Math.min(100, (subtotalAfterDiscount / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-surface-900 mb-2">Shopping Cart</h1>
      <p className="text-sm text-surface-500 mb-8">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Free shipping progress */}
          <div className="rounded-2xl border border-primary-100 bg-primary-50/50 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-2">
              {freeShippingRemaining > 0 ? (
                <>
                  <Truck className="h-4 w-4 text-primary-600" />
                  Add <span className="font-bold text-primary-700">₹{freeShippingRemaining.toFixed(2)}</span> more for FREE shipping!
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">You've unlocked FREE shipping!</span>
                </>
              )}
            </div>
            <div className="h-2 rounded-full bg-white overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {cart.map((item) => (
            <div key={item.id} className="card p-4 flex gap-4 animate-fade-in hover:border-primary-100">
              <Link to={`/products/${item.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-100">
                <img
                  src={item.image || `https://picsum.photos/seed/${item.id}/100/100`}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.id}`} className="text-sm font-semibold text-surface-900 hover:text-primary-600 transition-colors line-clamp-1">
                  {item.name}
                </Link>
                <p className="text-xs text-surface-500 mt-0.5">{item.vendorName}</p>
                {item.addons && item.addons.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.addons.map((addon, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-surface-500">{addon.title}</span>
                        <span className="text-primary-600">₹{addon.price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-surface-200 bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-surface-400 hover:text-surface-700 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-surface-400 hover:text-surface-700 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-surface-900 block">
                      ₹{(item.price * item.quantity + (item.addonTotal || 0)).toFixed(2)}
                    </span>
                    {item.addons && item.addons.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-surface-400">Add-ons:</span>
                        <span className="text-xs text-primary-600">+₹{item.addonTotal?.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors self-start"
                aria-label={`Remove ${item.name} from cart`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <button onClick={clearCart} className="btn-ghost text-sm text-red-500 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> Clear Cart
            </button>
            <Link to="/products" className="btn-ghost text-sm text-primary-600">
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              { icon: ShieldCheck, label: 'Secure Payments' },
              { icon: RotateCcw, label: 'Easy Returns' },
              { icon: Truck, label: 'Fast Delivery' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-white border border-surface-100 p-3 text-center">
                <Icon className="h-4 w-4 text-primary-600" />
                <span className="text-[11px] font-medium text-surface-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Order Summary</h3>

            {/* Coupon section */}
            {!coupon ? (
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="input-field pl-9 py-2.5 text-sm font-mono uppercase"
                      aria-label="Coupon code"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn-primary px-4 text-sm disabled:opacity-50"
                  >
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" /> {couponError}
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800 font-mono">{coupon.code}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="btn-ghost p-1 text-surface-400 hover:text-red-500"
                  title="Remove coupon"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-100">
                    <img src={item.image || `https://picsum.photos/seed/${item.id}/50/50`} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-surface-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-semibold">
                    ₹{(item.price * item.quantity + (item.addonTotal || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-surface-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="text-surface-500">Coupon Discount ({coupon?.code})</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-surface-500">Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Tax (8%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-surface-100">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span className="text-surface-500">You save</span>
                  <span>₹{savings.toFixed(2)}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              className="btn-primary w-full mt-6"
            >
              {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link to="/products" className="btn-secondary w-full mt-3 text-center">
              Continue Shopping
            </Link>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-surface-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              100% secure & encrypted checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
