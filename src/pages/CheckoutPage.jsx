import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
import { CreditCard, Lock, CheckCircle, MapPin, AlertCircle, Mail, Smartphone, Banknote, ShieldCheck, Truck, Ticket, X, Loader2, Trash2, Plus, BookmarkCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckoutInterceptor } from '../context/CheckoutInterceptorContext';
import { createOrder, incrementProductSold, incrementVendorSales, getCouponByCode, incrementCouponUsage, reserveUtr, completeUtrClaim, cancelUtrClaim } from '../config/firestore';
import { getCouponStatus, computeDiscount, normalizeCoupon, normalizeCouponCode } from '../utils/coupons';
import { isValidUtrFormat, normalizeUtr } from '../utils/paymentMatch';
import { trackEvent } from '../config/analytics';
import UpiPayment from '../components/ui/UpiPayment';
=======
import { CreditCard, Lock, CheckCircle, MapPin, AlertCircle, Phone, Smartphone, Banknote, Copy, Check, Ticket, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckoutInterceptor } from '../context/CheckoutInterceptorContext';
import {
  createOrder,
  incrementProductSold,
  incrementVendorSales,
  getCouponByCode,
  incrementCouponUsage,
  isValidUtr,
} from '../config/firestore';

const UPI_ID = '8160587811@kotak811';
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 49;
const TAX_RATE = 0.08;
const COD_ADVANCE_RATE = 0.2;
const COD_MIN_ADVANCE = 499;

const QR_URL = (payload) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=12&data=${encodeURIComponent(payload)}`;

const isValidLuhn = (number) => {
  const digits = String(number).replace(/\D/g, '');
  if (digits.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

const formatMoney = (value) => `₹${(Math.round(value * 100) / 100).toFixed(2)}`;
>>>>>>> Stashed changes

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { intercept } = useCheckoutInterceptor();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
<<<<<<< Updated upstream
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiRef, setUpiRef] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
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
=======
  const [error, setError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [utr, setUtr] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [copied, setCopied] = useState(false);
>>>>>>> Stashed changes

  const [form, setForm] = useState({
    fullName: user?.displayName || '',
    phone: user?.phoneNumber || '',
    address: '',
    city: '',
    state: '',
    zip: '',
<<<<<<< Updated upstream
    country: 'IN',
=======
>>>>>>> Stashed changes
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

<<<<<<< Updated upstream
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
=======
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Apply coupon discount
  const subtotalAfterCoupon = coupon
    ? Math.max(0, cartTotal - (coupon.discountType === 'percent' ? (cartTotal * (coupon.discountValue / 100)) : coupon.discountValue))
    : cartTotal;

  const shipping = subtotalAfterCoupon > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = subtotalAfterCoupon * TAX_RATE;
  const total = subtotalAfterCoupon + shipping + tax;
  const codAdvance = Math.max(COD_MIN_ADVANCE, Math.round(total * COD_ADVANCE_RATE));

>>>>>>> Stashed changes
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }
    if (!isAuthenticated) {
      setNeedsAuth(true);
    }
  }, [cart.length, isAuthenticated, navigate]);

<<<<<<< Updated upstream
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
=======
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponApplying(true);
    setCouponError('');
    try {
      const found = await getCouponByCode(couponCode);
      if (!found) {
        setCouponError('Invalid coupon code.');
        setCoupon(null);
        return;
      }
      const now = Date.now();
      if (found.expiresAt && now > new Date(found.expiresAt.seconds * 1000).getTime()) {
        setCouponError('This coupon has expired.');
        setCoupon(null);
        return;
      }
      if (found.maxUses && found.usedCount >= found.maxUses) {
        setCouponError('This coupon has reached its usage limit.');
        setCoupon(null);
        return;
      }
      if (found.minOrder && cartTotal < found.minOrder) {
        setCouponError(`Minimum order of ${formatMoney(found.minOrder)} required for this coupon.`);
        setCoupon(null);
        return;
      }
      setCoupon(found);
      setCouponCode('');
    } catch (err) {
      console.error('Failed to apply coupon:', err);
      setCouponError('Could not apply coupon. Please try again.');
    } finally {
      setCouponApplying(false);
    }
  };

>>>>>>> Stashed changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      try {
        await intercept('checkout', { form, total });
        return;
      } catch (err) {
        if (err.message !== 'Authentication cancelled') {
          setError('Authentication required to complete purchase');
        }
        return;
      }
    }

<<<<<<< Updated upstream
    // Validate payment before anything else
    const validationError = validatePayment();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Proceed with normal checkout for authenticated users
=======
    // Validate payment inputs
    if (paymentMethod === 'upi') {
      if (!isValidUtr(utr)) {
        setError('Enter a valid 12-22 digit UPI Transaction Reference (UTR). It appears on your bank statement after payment.');
        return;
      }
    }

    if (paymentMethod === 'card') {
      if (!isValidLuhn(form.cardNumber)) {
        setError('Enter a valid card number.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry)) {
        setError('Enter card expiry as MM/YY.');
        return;
      }
      if (!/^\d{3,4}$/.test(form.cardCvc)) {
        setError('Enter a valid CVC.');
        return;
      }
    }

    if (paymentMethod === 'cod') {
      if (codAdvance > total) {
        setError('The COD advance exceeds the order total. Please choose another payment method.');
        return;
      }
    }

>>>>>>> Stashed changes
    await processCheckout();
  };

  const processCheckout = async () => {
    setProcessing(true);

<<<<<<< Updated upstream
    let utrReservation = null;

    try {
      // Reserve the UTR up-front (unique across all customers). Throws if the
      // reference was already claimed by anyone.
      if (upiRef && paymentMethod !== 'card') {
        try {
          const res = await reserveUtr(normalizeUtr(upiRef), user.uid);
          if (res.duplicate) {
            throw new Error('This UTR has already been used for another order.');
          }
          utrReservation = res.ref;
        } catch (err) {
          throw new Error('This UTR has already been used for another order.');
        }
      }

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
=======
    const isUpi = paymentMethod === 'upi';
    const isCod = paymentMethod === 'cod';
    const paymentStatus = isUpi ? 'pending-verification' : isCod ? 'advance-paid' : 'paid';
>>>>>>> Stashed changes

    const orderData = {
      customerId: user.uid,
      customerName: form.fullName,
      customerPhone: form.phone,
      shippingAddress: {
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: 'IN',
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
      subtotal: cartTotal,
      discount: coupon ? cartTotal - subtotalAfterCoupon : 0,
      couponCode: coupon?.code || null,
      couponId: coupon?.id || null,
      shipping,
      tax,
      total,
      paymentMethod,
      paymentStatus,
      paymentReference: isUpi ? utr.trim().toUpperCase() : null,
      cardLast4: paymentMethod === 'card' ? form.cardNumber.replace(/\D/g, '').slice(-4) : null,
      codAdvance: isCod ? codAdvance : null,
      codRemaining: isCod ? total - codAdvance : null,
      currency: 'INR',
    };

    try {
      const newOrderId = await createOrder(orderData);

      if (utrReservation) {
        try { await completeUtrClaim(utrReservation, newOrderId); } catch (err) { console.warn('Could not finalize UTR claim:', err); }
      }

      if (coupon?.id) {
        try { await incrementCouponUsage(coupon.id); } catch (err) { console.warn('Could not increment coupon usage:', err); }
      }

      for (const item of cart) {
        try { await incrementProductSold(item.id, item.quantity); } catch (err) { console.warn('Could not increment product sold count:', err); }
        if (item.vendorId) {
          try { await incrementVendorSales(item.vendorId, item.price * item.quantity); } catch (err) { console.warn('Could not increment vendor sales:', err); }
        }
      }

      if (coupon?.id) {
        await incrementCouponUsage(coupon.id);
      }

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
      // Release the UTR reservation so it's not blocked if checkout failed.
      if (utrReservation) {
        await cancelUtrClaim(utrReservation);
      }
      console.error('Order failed:', err);
      setError(err?.message && err.message.includes('UTR')
        ? err.message
        : 'Failed to place order. Please try again.');
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
        <h1 className="text-3xl font-display font-bold text-surface-900">
          {paymentMethod === 'upi' ? 'Payment Under Verification' : 'Order Confirmed!'}
        </h1>
        <p className="mt-4 text-surface-500">
          {paymentMethod === 'upi'
            ? `Your order #${orderId?.slice(0, 8)} is placed. We're verifying your UPI payment (UTR ${utr.trim().toUpperCase()}). Once confirmed, your items will be shipped.`
            : paymentMethod === 'cod'
            ? `Your order #${orderId?.slice(0, 8)} is confirmed. Advance of ${formatMoney(codAdvance)} received; pay ${formatMoney(total - codAdvance)} on delivery.`
            : `Your order #${orderId?.slice(0, 8)} is confirmed. Payment received via card ending in ${form.cardNumber.replace(/\D/g, '').slice(-4)}.`}
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
<<<<<<< Updated upstream
          <button
            onClick={() => handleSubmit({ preventDefault: () => {} })}
            className="btn-primary"
          >
            Sign In to Continue
=======
          <button onClick={() => handleSubmit({ preventDefault: () => {} })} className="btn-primary">
            Continue with Phone Verification
>>>>>>> Stashed changes
          </button>
          <button onClick={() => navigate('/cart')} className="btn-secondary">Back to Cart</button>
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
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" className="input-field" required />
                <input name="address" value={form.address} onChange={handleChange} placeholder="Street Address" className="input-field sm:col-span-2" required />
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="input-field" required />
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input-field" required />
                <input name="zip" value={form.zip} onChange={handleChange} placeholder="PIN Code" className="input-field" required />
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

            {/* Payment Method */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <Banknote className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900">Payment Method</h3>
              </div>

<<<<<<< Updated upstream
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
=======
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'upi', label: 'UPI', icon: Smartphone },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'cod', label: 'COD', icon: Banknote },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-all ${
                      paymentMethod === id
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-surface-100 text-surface-500 hover:border-primary-200 hover:bg-surface-50'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    {label}
                  </button>
                ))}
              </div>

              {/* UPI */}
              {paymentMethod === 'upi' && (
                <div className="space-y-5">
                  <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 flex flex-col sm:flex-row items-center gap-5">
                    <img
                      src={QR_URL(`upi://pay?pa=${UPI_ID}&pn=Speedersmania&am=${total.toFixed(2)}&cu=INR&tn=Order ${cart.length} item(s)`)}
                      alt="UPI QR Code"
                      className="h-36 w-36 rounded-xl bg-white p-2 border border-surface-100"
                    />
                    <div className="text-center sm:text-left flex-1">
                      <p className="font-semibold text-surface-900">Pay via any UPI app</p>
                      <p className="mt-1 text-sm text-surface-500">Scan the QR or pay to this UPI ID:</p>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white border border-primary-200 px-3 py-2">
                        <span className="font-mono font-semibold text-primary-700">{UPI_ID}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(UPI_ID);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="text-primary-600 hover:text-primary-800"
                          title="Copy UPI ID"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-primary-700">Amount to pay: {formatMoney(total)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      UPI Transaction Reference (UTR)
                    </label>
                    <input
                      name="utr"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.toUpperCase())}
                      placeholder="e.g. 412345678901"
                      className="input-field uppercase"
                      required={paymentMethod === 'upi'}
                    />
                    <p className="mt-1.5 text-xs text-surface-500">
                      After paying, your bank app shows a 12-digit UTR. Enter it here to complete the order. We'll verify it manually within 24 hours.
                    </p>
                  </div>
                </div>
              )}

              {/* Card */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      name="cardNumber"
                      value={form.cardNumber}
                      onChange={(e) => setForm({ ...form, cardNumber: e.target.value.replace(/[^\d]/g, '').slice(0, 16) })}
                      placeholder="Card Number"
                      className="input-field sm:col-span-2"
                      inputMode="numeric"
                      required={paymentMethod === 'card'}
                    />
                    <input
                      name="cardExpiry"
                      value={form.cardExpiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                        if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                        setForm({ ...form, cardExpiry: v });
                      }}
                      placeholder="MM/YY"
                      className="input-field"
                      required={paymentMethod === 'card'}
                    />
                    <input
                      name="cardCvc"
                      value={form.cardCvc}
                      onChange={(e) => setForm({ ...form, cardCvc: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
                      placeholder="CVC"
                      className="input-field"
                      inputMode="numeric"
                      required={paymentMethod === 'card'}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-surface-500">
                    <Lock className="h-3.5 w-3.5" />
                    Card details are validated and only the last 4 digits are stored.
                  </div>
                </div>
              )}

              {/* COD */}
              {paymentMethod === 'cod' && (
                <div className="rounded-xl bg-surface-50 border border-surface-100 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-surface-600">Advance (pay now)</span>
                    <span className="font-semibold text-surface-900">{formatMoney(codAdvance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-600">Payable on delivery</span>
                    <span className="font-semibold text-surface-900">{formatMoney(total - codAdvance)}</span>
                  </div>
                  <p className="pt-2 text-xs text-surface-500">
                    Pay the advance via the UPI ID shown, then share the UTR. Balance is collected by our delivery partner.
                  </p>
                  <div className="pt-1 inline-flex items-center gap-2 rounded-lg bg-white border border-primary-200 px-3 py-2">
                    <span className="font-mono font-semibold text-primary-700 text-xs">{UPI_ID}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(UPI_ID);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-primary-600 hover:text-primary-800"
                      title="Copy UPI ID"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Advance UTR (optional)</label>
                    <input
                      name="utr"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.toUpperCase())}
                      placeholder="e.g. 412345678901"
                      className="input-field uppercase"
                    />
>>>>>>> Stashed changes
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Order Summary</h3>

<<<<<<< Updated upstream
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
=======
              {/* Coupon */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="input-field uppercase"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponApplying}
                    className="btn-secondary shrink-0 px-4"
                  >
                    <Ticket className="h-4 w-4" />
                  </button>
                </div>
                {couponError && <p className="mt-1.5 text-xs text-red-500">{couponError}</p>}
                {coupon && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs">
                    <span className="font-semibold text-emerald-700">
                      {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `${formatMoney(coupon.discountValue)} off`} applied
                    </span>
                    <button type="button" onClick={() => setCoupon(null)} className="text-emerald-600 hover:text-emerald-800">Remove</button>
                  </div>
                )}
              </div>
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
                    <span className="text-xs font-semibold">
                      ₹{(item.price * item.quantity + (item.addonTotal || 0)).toFixed(2)}
                    </span>
                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-1 text-[10px] text-primary-600">
                        +₹{item.addonTotal?.toFixed(2)} add-ons
                      </div>
                    )}
=======
                    <span className="text-xs font-semibold">{formatMoney(item.price * item.quantity + (item.addonTotal || 0))}</span>
>>>>>>> Stashed changes
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-surface-100 space-y-2 text-sm">
                <div className="flex justify-between">
<<<<<<< Updated upstream
                  <span className="text-surface-500">Item Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="text-surface-500">Coupon Discount ({coupon?.code})</span>
                    <span>-₹{discount.toFixed(2)}</span>
=======
                  <span className="text-surface-500">Subtotal</span>
                  <span>{formatMoney(cartTotal)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon ({coupon.code})</span>
                    <span>-{formatMoney(cartTotal - subtotalAfterCoupon)}</span>
>>>>>>> Stashed changes
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-surface-500">Shipping</span>
<<<<<<< Updated upstream
                  <span>{shipping === 0 ? <span className="text-emerald-600 font-medium">Free</span> : `₹${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">GST (18%)</span>
                  <span className="text-xs text-surface-400">₹{tax.toFixed(2)}</span>
=======
                  <span>{shipping === 0 ? 'Free' : formatMoney(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Tax (8%)</span>
                  <span>{formatMoney(tax)}</span>
>>>>>>> Stashed changes
                </div>
                {paymentMethod === 'cod' && (
                  <>
                    <div className="flex justify-between text-amber-600">
                      <span>COD advance</span>
                      <span>-{formatMoney(codAdvance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">On delivery</span>
                      <span>{formatMoney(total - codAdvance)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t border-surface-100">
                  <span className="font-semibold">Total</span>
<<<<<<< Updated upstream
                  <span className="font-bold">₹{total.toFixed(2)}</span>
=======
                  <span className="font-bold">{formatMoney(total)}</span>
>>>>>>> Stashed changes
                </div>
                {(discount > 0 || shipping === 0) && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 mt-2">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    You're saving ₹{(discount + (cartTotal - discount > 999 ? 49 : 0)).toFixed(2)} on this order
                  </div>
                )}
              </div>
              <button type="submit" disabled={processing} className="btn-primary w-full mt-6">
<<<<<<< Updated upstream
                {processing ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
=======
                {processing ? (
                  'Processing...'
                ) : paymentMethod === 'upi' ? (
                  <>Place Order · Pay {formatMoney(total)} <ArrowRight className="h-4 w-4" /></>
                ) : paymentMethod === 'cod' ? (
                  <>Place Order · Pay {formatMoney(codAdvance)} Now</>
                ) : (
                  `Place Order · Pay ${formatMoney(total)}`
                )}
>>>>>>> Stashed changes
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
