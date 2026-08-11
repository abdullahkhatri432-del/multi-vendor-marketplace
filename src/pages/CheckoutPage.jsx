import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, MapPin, AlertCircle, Mail, Smartphone, Banknote, ShieldCheck, Truck, Ticket, X, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckoutInterceptor } from '../context/CheckoutInterceptorContext';
import { createOrder, incrementProductSold, incrementVendorSales, getCouponByCode, incrementCouponUsage, getOrderByUtr } from '../config/firestore';
import { getCouponStatus, computeDiscount, normalizeCoupon, normalizeCouponCode } from '../utils/coupons';
import { isValidUtrFormat, normalizeUtr } from '../utils/paymentMatch';
import { trackEvent } from '../config/analytics';
import UpiPayment from '../components/ui/UpiPayment';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { intercept } = useCheckoutInterceptor();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiRef, setUpiRef] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [form, setForm] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'IN',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const shippingBase = cartTotal > 999 ? 0 : 49;
  const discount = computeDiscount(coupon, cartTotal);
  const subtotalAfterDiscount = cartTotal - discount;
  const shipping = subtotalAfterDiscount > 999 ? 0 : 49;
  const tax = subtotalAfterDiscount * 0.08;
  const total = subtotalAfterDiscount + shipping + tax;
  const codAdvance = Math.min(total, Math.max(499, Math.round(total * 0.2)));
  const codBalance = total - codAdvance;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setUpiRef('');
    setPaymentConfirmed(false);
    setError('');
  };

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

  // ===== Payment validation helpers =====
  const luhnCheck = (num) => {
    const digits = num.replace(/\s+/g, '');
    if (!/^\d{15,16}$/.test(digits)) return false;
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits[i], 10);
      if (alt) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      alt = !alt;
    }
    return sum % 10 === 0;
  };

  const validateExpiry = (exp) => {
    if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
    const [mm, yy] = exp.split('/').map(Number);
    if (mm < 1 || mm > 12) return false;
    const expDate = new Date(2000 + yy, mm, 1);
    return expDate > new Date();
  };

const isValidUpiRef = (ref) => {
    return isValidUtrFormat(ref);
  };

  const validatePayment = () => {
    if (paymentMethod === 'card') {
      if (!luhnCheck(form.cardNumber)) return 'Please enter a valid 15-16 digit card number.';
      if (!validateExpiry(form.cardExpiry)) return 'Card expiry must be valid MM/YY and not in the past.';
      if (!/^\d{3,4}$/.test(form.cardCvc)) return 'CVC must be 3-4 digits.';
    }
    if (paymentMethod === 'upi') {
      if (!isValidUpiRef(upiRef)) return 'Please enter the UPI transaction reference (UTR) you received after paying.';
      if (!paymentConfirmed) return 'Please confirm that you have completed the UPI payment.';
    }
    if (paymentMethod === 'cod') {
      if (!isValidUpiRef(upiRef)) return 'Please enter the UPI transaction reference (UTR) for your advance payment.';
      if (!paymentConfirmed) return 'Please confirm that you have paid the advance amount.';
    }
    return null;
  };

  // Check auth when page loads - redirect to login if no cart or if we need to intercept
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }
    
    // If user is not authenticated, we'll show the login prompt
    if (!isAuthenticated) {
      setNeedsAuth(true);
    }
  }, [cart.length, isAuthenticated, navigate]);

  // Funnel event: user reached checkout with a non-empty cart
  useEffect(() => {
    if (cart.length > 0) {
      trackEvent('begin_checkout', {
        value: cartTotal,
        items: cart.map((item) => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intercept checkout for unauthenticated users
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      try {
        // This will open the lazy auth modal and wait for resolution
        await intercept('checkout', { form, total });
        // If we get here, auth succeeded - the page will re-render with user
        return;
      } catch (err) {
        // User cancelled or auth failed
        if (err.message !== 'Authentication cancelled') {
          setError('Authentication required to complete purchase');
        }
        return;
      }
    }

    // Validate payment before anything else
    const validationError = validatePayment();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Proceed with normal checkout for authenticated users
    await processCheckout();
  };

  const processCheckout = async () => {
    setProcessing(true);

    try {
      const orderData = {
        customerId: user.uid,
        customerName: form.fullName,
        customerEmail: form.email,
        shippingAddress: {
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          addons: item.addons || [],
          addonTotal: item.addonTotal || 0,
        })),
        vendorIds: [...new Set(cart.map((item) => item.vendorId).filter(Boolean))],
        subtotal: cartTotal,
        discount,
        couponCode: coupon?.code || null,
        couponId: coupon?.id || null,
        shipping,
        tax,
        total,
paymentMethod,
        paymentStatus:
          paymentMethod === 'card' ? 'completed' : 'pending-verification',
        paymentReference: normalizeUtr(upiRef) || null,
        paymentDetails:
          paymentMethod === 'card'
            ? { cardLast4: form.cardNumber.replace(/\s+/g, '').slice(-4) }
            : {
                upiId: '8160587811@kotak811',
                transactionRef: normalizeUtr(upiRef),
                confirmedAt: new Date().toISOString(),
              },
        ...(paymentMethod === 'cod' && {
          advanceAmount: codAdvance,
          balanceDue: codBalance,
          paymentNote: `₹${codAdvance.toFixed(2)} advance paid (UTR ${normalizeUtr(upiRef)}), ₹${codBalance.toFixed(2)} payable on delivery`,
        }),
      };

      if (upiRef && paymentMethod !== 'card') {
        const existing = await getOrderByUtr(normalizeUtr(upiRef), user.uid);
        if (existing) {
          throw new Error('This UTR has already been used for another order.');
        }
      }

      const newOrderId = await createOrder(orderData);

      if (coupon?.id) {
        try { await incrementCouponUsage(coupon.id); } catch (err) { console.warn('Could not increment coupon usage:', err); }
      }

      for (const item of cart) {
        try { await incrementProductSold(item.id, item.quantity); } catch (err) { console.warn('Could not increment product sold count:', err); }
        if (item.vendorId) {
          try { await incrementVendorSales(item.vendorId, item.price * item.quantity); } catch (err) { console.warn('Could not increment vendor sales:', err); }
        }
      }

      setOrderId(newOrderId);
      setOrderComplete(true);
      clearCart();

      trackEvent('purchase', {
        transaction_id: newOrderId,
        value: total,
        items: cart.map((item) => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          currency: 'INR',
        })),
        coupon: coupon?.code || null,
        payment_method: paymentMethod,
      });
} catch (err) {
      console.error('Order failed:', err);
      setError(err?.message && err.message.includes('UTR')
        ? err.message
        : 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Error state for display
  const [error, setError] = useState('');

  if (orderComplete) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center animate-scale-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-display font-bold text-surface-900">Order Confirmed!</h1>
        <p className="mt-4 text-surface-500">
          Thank you for your purchase. Your order <span className="font-semibold text-surface-700">#{orderId?.slice(0, 8)}</span> has been placed successfully.
        </p>
        {paymentMethod !== 'card' && (
          <div className="mt-4 mx-auto max-w-md rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
            Your UPI payment is marked <span className="font-semibold">pending verification</span>. It will be confirmed after
            the seller verifies your UTR against the bank statement (usually within a few hours).
          </div>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/orders')} className="btn-primary">View Orders</button>
          <button onClick={() => navigate('/products')} className="btn-secondary">Continue Shopping</button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return null;
  }

  // Show auth prompt for unauthenticated users
  if (needsAuth && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 mx-auto mb-6">
          <Mail className="h-10 w-10 text-primary-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-surface-900">Sign in to Complete Purchase</h1>
        <p className="mt-4 text-surface-500 max-w-md mx-auto">
          To securely process your order, please sign in with your email and password.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => handleSubmit({ preventDefault: () => {} })}
            className="btn-primary"
          >
            Sign In to Continue
          </button>
          <button onClick={() => navigate('/cart')} className="btn-secondary">
            Back to Cart
          </button>
        </div>
        <p className="mt-6 text-sm text-surface-400">
          Or <button onClick={() => navigate('/login')} className="text-primary-600 hover:underline font-medium">sign in with email</button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <h1 className="text-3xl font-display font-bold text-surface-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Info */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <MapPin className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900">Shipping Address</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" className="input-field" required />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="input-field" required />
                <input name="address" value={form.address} onChange={handleChange} placeholder="Street Address" className="input-field sm:col-span-2" required />
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="input-field" required />
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input-field" required />
                <input name="zip" value={form.zip} onChange={handleChange} placeholder="ZIP Code" className="input-field" required />
                <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="input-field" required />
              </div>
            </div>

            {/* Payment Info */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900">Payment Details</h3>
              </div>

              {/* Payment Method Toggle */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('upi')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-semibold transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-surface-200 text-surface-500 hover:border-surface-300'
                  }`}
                >
                  <Smartphone className="h-5 w-5" /> UPI
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('card')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-semibold transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-surface-200 text-surface-500 hover:border-surface-300'
                  }`}
                >
                  <CreditCard className="h-5 w-5" /> Card
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('cod')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-semibold transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-surface-200 text-surface-500 hover:border-surface-300'
                  }`}
                >
                  <Banknote className="h-5 w-5" /> COD
                </button>
              </div>

              {paymentMethod === 'upi' && (
                <UpiPayment amount={total} upiRef={upiRef} onUpiRefChange={setUpiRef} />
              )}

              {(paymentMethod === 'upi' || paymentMethod === 'cod') && (
                <label className="mt-4 flex items-start gap-3 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfirmed}
                    onChange={(e) => setPaymentConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-surface-600">
                    I confirm that I have completed the payment of{' '}
                    <span className="font-semibold text-surface-800">
                      ₹{(paymentMethod === 'cod' ? codAdvance : total).toFixed(2)}
                    </span>
                    {' '}via UPI, and I understand the order will only be placed after my payment is verified.
                  </span>
                </label>
              )}

              {paymentMethod === 'card' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input name="cardNumber" value={form.cardNumber} onChange={handleChange} placeholder="Card Number (15-16 digits)" inputMode="numeric" className="input-field sm:col-span-2 font-mono" required />
                    <input name="cardExpiry" value={form.cardExpiry} onChange={handleChange} placeholder="MM/YY" inputMode="numeric" className="input-field font-mono" required />
                    <input name="cardCvc" value={form.cardCvc} onChange={handleChange} placeholder="CVC" inputMode="numeric" className="input-field font-mono" required />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-surface-500">
                    <Lock className="h-3.5 w-3.5" />
                    Card is validated (Luhn check + expiry). Only the last 4 digits are stored.
                  </div>
                </>
              )}

              {paymentMethod === 'cod' && (
                <div className="mt-2 space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <Truck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Cash on Delivery — Advance Required</p>
                      <p className="mt-1 text-xs text-amber-700">
                        Pay a small <span className="font-semibold">₹{codAdvance.toFixed(2)}</span> advance now to secure your order.
                        Remaining <span className="font-semibold">₹{codBalance.toFixed(2)}</span> payable in cash/UPI at delivery.
                      </p>
                    </div>
                  </div>
                  <UpiPayment amount={codAdvance} upiRef={upiRef} onUpiRefChange={setUpiRef} />
                  <div className="flex items-center gap-2 text-xs text-surface-500">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Advance is refunded if the order is cancelled before dispatch.
                  </div>
                </div>
              )}
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
                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-1 text-[10px] text-primary-600">
                        +₹{item.addonTotal?.toFixed(2)} add-ons
                      </div>
                    )}
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
                  <span className="text-surface-500">Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-surface-100">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">₹{total.toFixed(2)}</span>
                </div>
              </div>
              <button type="submit" disabled={processing} className="btn-primary w-full mt-6">
                {processing ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
