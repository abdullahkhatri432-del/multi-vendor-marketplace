import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, AlertCircle, Mail, Smartphone, Banknote, ShieldCheck, Truck, Ticket, X, Loader2, Trash2, BookmarkCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckoutInterceptor } from '../context/CheckoutInterceptorContext';
import { getCouponByCode } from '../config/firestore';
import { getCouponStatus, computeDiscount, normalizeCoupon, normalizeCouponCode } from '../utils/coupons';
import { isValidUtrFormat, normalizeUtr } from '../utils/paymentMatch';
import { computeTotals, computeCodSplit, TAX_RATE } from '../config/pricing';
import { trackEvent } from '../config/analytics';
import UpiPayment from '../components/ui/UpiPayment';

const CREATE_ORDER_ENDPOINT =
  import.meta.env.VITE_CREATE_ORDER_ENDPOINT || '/api/create-order';

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
  const [error, setError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const ADDRESS_KEY = `speedersmania_addresses_${user?.uid || 'guest'}`;

  // Load saved addresses on mount / when user changes
  useEffect(() => {
    if (!user) return;
    try {
      const list = JSON.parse(localStorage.getItem(ADDRESS_KEY) || '[]');
      setSavedAddresses(list);
      const lastUsedId = localStorage.getItem(`${ADDRESS_KEY}_last`);
      const match = list.find((a) => a.id === lastUsedId);
      if (match) {
        setForm((f) => ({ ...f, ...match }));
        setSelectedAddressId(match.id);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const [form, setForm] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'IN',
  });

  // Preview totals only — /api/create-order recomputes and is authoritative.
  const discount = computeDiscount(coupon, cartTotal);
  const { shipping, tax, total } = computeTotals(cartTotal, discount);
  const { advanceAmount: codAdvance, balanceDue: codBalance } = computeCodSplit(total);
  const payableNow = paymentMethod === 'cod' ? codAdvance : total;

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

  // ===== Saved address book =====
  const persistAddresses = (list) => {
    setSavedAddresses(list);
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(list));
  };

  const selectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setForm((f) => ({ ...f, ...addr }));
    localStorage.setItem(`${ADDRESS_KEY}_last`, addr.id);
  };

  const deleteAddress = (id) => {
    persistAddresses(savedAddresses.filter((a) => a.id !== id));
    if (selectedAddressId === id) {
      setSelectedAddressId('');
      localStorage.removeItem(`${ADDRESS_KEY}_last`);
    }
  };

  const persistCurrentAddress = () => {
    const entry = {
      id: Date.now().toString(),
      fullName: form.fullName,
      email: form.email,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      country: form.country,
    };
    if (!entry.address || !entry.city || !entry.fullName) return;
    const next = [entry, ...savedAddresses.filter((a) => a.id !== selectedAddressId)].slice(0, 6);
    persistAddresses(next);
    setSelectedAddressId(entry.id);
    localStorage.setItem(`${ADDRESS_KEY}_last`, entry.id);
  };

  // ===== Payment validation helpers =====
  const validatePayment = () => {
    if (paymentMethod === 'upi') {
      if (!isValidUtrFormat(upiRef)) return 'Please enter the UPI transaction reference (UTR) you received after paying.';
      if (!paymentConfirmed) return 'Please confirm that you have completed the UPI payment.';
    }
    if (paymentMethod === 'cod') {
      if (!isValidUtrFormat(upiRef)) return 'Please enter the UPI transaction reference (UTR) for your advance payment.';
      if (!paymentConfirmed) return 'Please confirm that you have paid the advance amount.';
    }
    return null;
  };

  // Redirect only when there is nothing to check out and no completed order
  // to show. Without the `orderComplete` guard, clearCart() after a successful
  // purchase would immediately bounce the user to /cart and hide the receipt.
  useEffect(() => {
    if (cart.length === 0 && !orderComplete) {
      navigate('/cart');
      return;
    }

    if (!isAuthenticated) {
      setNeedsAuth(true);
    }
  }, [cart.length, isAuthenticated, navigate, orderComplete]);

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
    setError('');

    try {
      // Everything below is re-validated and re-priced server-side. The client
      // only sends product ids, quantities, the selected add-ons, the address
      // and the payment proof — never prices or totals.
      const idToken = await user.getIdToken();

      const response = await fetch(CREATE_ORDER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
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
            quantity: item.quantity,
            addons: (item.addons || []).map((addon) => ({
              id: addon.id,
              title: addon.title,
            })),
          })),
          couponCode: coupon?.code || null,
          paymentMethod,
          utr: normalizeUtr(upiRef),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not place your order. Please try again.');
      }

      const newOrderId = data.orderId;
      const chargedTotal = Number(data.total) || total;

      setOrderId(newOrderId);
      setOrderComplete(true);
      clearCart();

      if (saveAddress) {
        const entry = {
          id: Date.now().toString(),
          fullName: form.fullName,
          email: form.email,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        };
        const next = [entry, ...savedAddresses.filter((a) => a.id !== selectedAddressId)].slice(0, 6);
        persistAddresses(next);
        setSelectedAddressId(entry.id);
        localStorage.setItem(`${ADDRESS_KEY}_last`, entry.id);
      }

      trackEvent('purchase', {
        transaction_id: newOrderId,
        value: chargedTotal,
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
      setError(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

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
        <div className="mt-4 mx-auto max-w-md rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
          Your payment is marked <span className="font-semibold">pending verification</span>. It will be confirmed after
          the seller verifies your UTR against the bank statement (usually within a few hours).
          You can track the status in <span className="font-semibold">My Orders</span>.
        </div>
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

              {/* Saved addresses */}
              {savedAddresses.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Saved Addresses</p>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr) => (
                      <button
                        type="button"
                        key={addr.id}
                        onClick={() => selectAddress(addr)}
                        className={`group flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-surface-200 hover:border-surface-300'
                        }`}
                      >
                        <MapPin className={`h-3.5 w-3.5 ${selectedAddressId === addr.id ? 'text-primary-600' : 'text-surface-400'}`} />
                        <span className="max-w-[160px]">
                          <span className="block font-medium text-surface-700 line-clamp-1">{addr.fullName}</span>
                          <span className="block text-surface-400 line-clamp-1">{addr.city}, {addr.state}</span>
                        </span>
                        <Trash2
                          onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }}
                          className="h-3.5 w-3.5 text-surface-300 hover:text-red-500 shrink-0"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" className="input-field" required />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="input-field" required />
                <input name="address" value={form.address} onChange={handleChange} placeholder="Street Address" className="input-field sm:col-span-2" required />
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="input-field" required />
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input-field" required />
                <input name="zip" value={form.zip} onChange={handleChange} placeholder="ZIP Code" className="input-field" required />
                <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="input-field" required />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  Save this address for faster checkout
                </label>
                <button
                  type="button"
                  onClick={persistCurrentAddress}
                  className="btn-ghost text-sm"
                  title="Save to your address book"
                >
                  <BookmarkCheck className="h-4 w-4" /> Save Now
                </button>
              </div>
            </div>

            {/* Payment Info */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <ShieldCheck className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900">Payment Details</h3>
              </div>

              {/* Payment Method Toggle */}
              <div className="grid grid-cols-2 gap-3 mb-4">
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
                  onClick={() => handlePaymentMethodChange('cod')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-semibold transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-surface-200 text-surface-500 hover:border-surface-300'
                  }`}
                >
                  <Banknote className="h-5 w-5" /> Cash on Delivery
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
                  <span className="text-surface-500">Item Subtotal</span>
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
                  <span>{shipping === 0 ? <span className="text-emerald-600 font-medium">Free</span> : `₹${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">GST ({Math.round(TAX_RATE * 100)}%)</span>
                  <span className="text-xs text-surface-400">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-surface-100">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">₹{total.toFixed(2)}</span>
                </div>
                {(discount > 0 || shipping === 0) && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 mt-2">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    You're saving ₹{(discount + (cartTotal - discount > 999 ? 49 : 0)).toFixed(2)} on this order
                  </div>
                )}
              </div>
              <button type="submit" disabled={processing} className="btn-primary w-full mt-6">
                {processing ? 'Processing...' : `Pay ₹${payableNow.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
