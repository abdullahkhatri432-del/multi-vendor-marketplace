export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { intercept } = useCheckoutInterceptor();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiRef, setUpiRef] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [copied, setCopied] = useState(false);
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

  // Apply coupon discount
  const subtotalAfterCoupon = coupon
    ? Math.max(0, cartTotal - (coupon.discountType === 'percent' ? (cartTotal * (coupon.discountValue / 100)) : coupon.discountValue))
    : cartTotal;

  const shipping = subtotalAfterCoupon > 999 ? 0 : 49;
  const tax = subtotalAfterCoupon * 0.08;
  const total = subtotalAfterCoupon + shipping + tax;
  const codAdvance = Math.max(499, Math.round(total * 0.2));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // UPI reference validation - UPI refs can be alphanumeric, up to 256 chars
  const isValidUpiRef = (ref) => {
    if (!ref || ref.trim().length === 0) return false;
    const r = String(ref).trim();
    return r.length >= 8 && r.length <= 256;
  };

  const validatePayment = () => {
    if (paymentMethod === 'upi') {
      if (!isValidUpiRef(upiRef)) return 'Please enter the UPI transaction reference (UTR) you received after paying.';
      if (!paymentConfirmed) return 'Please confirm that you have completed the UPI payment.';
    }
    return null;
  };

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }
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
  useEffect(() => {
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
  }, [isAuthenticated]);

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

    // Validate payment inputs
    if (paymentMethod === 'upi') {
      if (!isValidUtr(utr)) {
        setError('Enter a valid 12-22 digit UPI Transaction Reference (UTR). It appears on your bank statement after payment.');
        return;
      }
    }

    if (paymentMethod === 'cod') {
      if (codAdvance > total) {
        setError('The COD advance exceeds the order total. Please choose another payment method.');
        return;
      }
    }

    await processCheckout();
  };

  const processCheckout = async () => {
    setProcessing(true);

    const isUpi = paymentMethod === 'upi';
    const isCod = paymentMethod === 'cod';
    const paymentStatus = isUpi ? 'pending-verification' : isCod ? 'advance-paid' : 'paid';

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
        try { await completeUtrClaim(utrReservation, newOrderId, user.uid); } catch (err) { console.warn('Could not finalize UTR claim:', err); }
      }

      if (coupon?.id) {
        try { await incrementCouponUsage(coupon.id); } catch (err) { console.warn('Could not increment coupon usage:', err); }
      }

      for (const item of cart) {
        try { await incrementProductSold(item.id, item.quantity); } catch (err) { console.warn('Could not increment product sold count:', err); }
        if (item.vendorId) {
          try { await incrementVendorSales(item.vendorId, item.price * item.quantity, item.quantity); } catch (err) { console.warn('Could not increment vendor sales:', err); }
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
            ? `Your order #${orderId?.slice(0, 8)} is confirmed. Advance of ₹${codAdvance.toFixed(2)} received; pay ₹${(total - codAdvance).toFixed(2)} on delivery.`
            : `Your order #${orderId?.slice(0, 8)} is confirmed. Payment received via card ending in ${form.cardNumber.replace(/\D/g, '').slice(-4)}.`}
        </p>
        {paymentMethod !== 'card' && (
          <div className="mt-4 mx-auto max-w-md rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
            Your UPI payment is marked <span className="font-semibold">pending verification</span>. It will be confirmed after the seller verifies your UTR against the bank statement (usually within a few hours).
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
          <button onClick={() => handleSubmit({ preventDefault: () => {} })} className="btn-primary">Continue with Phone Verification</button>
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
                        className={`group flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs transition-all ${selectedAddressId === addr.id ? 'border-primary-600 bg-primary-50' : 'border-surface-200 hover:border-surface-300'}`}>
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
                    ))
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
                    className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
                  Save this address for faster checkout
                </label>
                <button
                  type="button"
                  onClick={persistCurrentAddress}
                  className="btn-ghost text-sm"
                  title="Save to your address book">
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

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[{ id: 'upi', label: 'UPI', icon: Smartphone }, { id: 'card', label: 'Card', icon: CreditCard }, { id: 'cod', label: 'COD', icon: Banknote }].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-all ${paymentMethod === id ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-surface-100 text-surface-500 hover:border-primary-200 hover:bg-surface-50'}`}>
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
                      src={`upi://pay?pa=${UPI_ID}&pn=Speedersmania&am=${total.toFixed(2)}&cu=INR&tn=Order ${cart.length} item(s)`}
                      alt="UPI QR Code"
                      className="h-36 w-36 rounded-xl bg-white p-2 border border-surface-100" />
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
                          title="Copy UPI ID">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-primary-700">Amount to pay: ₹{total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">UPI Transaction Reference (UTR)</label>
                    <input
                      name="utr"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.toUpperCase())}
                      placeholder="e.g. 412345678901"
                      className="input-field uppercase"
                      required={paymentMethod === 'upi'} />
                    <p className="mt-1.5 text-xs text-surface-500">
                      After paying, your bank app shows a 12-digit UTR. Enter it here to complete the order. We'll verify it manually within 24 hours.
                    </div>
                  </div>
                </div>
              )}

              {/* COD */}
              {paymentMethod === 'cod' && (
                <div className="rounded-xl bg-surface-50 border border-surface-100 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-surface-600">Advance (pay now)</span>
                    <span className="font-semibold text-surface-900">₹{codAdvance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-600">Payable on delivery</span>
                    <span className="font-semibold text-surface-900">₹{(total - codAdvance).toFixed(2)}</span>
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
                      title="Copy UPI ID">
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
                      className="input-field uppercase" />
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-surface-900 mb-4">Order Summary</h3>

                {/* Coupon */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="input-field uppercase" />
                    <button
                      type="button"
                      onClick={() => applyCoupon()}
                      disabled={couponApplying}
                      className="btn-secondary shrink-0 px-4">
                      <Ticket className="h-4 w-4" />
                    </button>
                  </div>
                  {couponError && <p className="mt-1.5 text-xs text-red-500">{couponError}</p>}
                  {coupon && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs">
                      <span className="font-semibold text-emerald-700">{coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `${formatMoney(coupon.discountValue)} off`} applied</span>
                      <button type="button" onClick={() => setCoupon(null)} className="text-emerald-600 hover:text-emerald-800">Remove</button>
                    </div>
                  )}
                </div>

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
                      <span className="text-xs font-semibold">₹{(item.price * item.quantity + (item.addonTotal || 0)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-surface-100 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-surface-500">Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Coupon ({coupon.code})</span>
                      <span>-₹{(cartTotal - subtotalAfterCoupon).toFixed(2)}</span>
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
                </div>
                {paymentMethod === 'cod' && (
                  <>
                    <div className="flex justify-between text-amber-600">
                      <span>COD advance</span>
                      <span>-₹{codAdvance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">On delivery</span>
                      <span>₹{(total - codAdvance).toFixed(2)}</span>
                    </div>
                  </>}
                )
                <div className="flex justify-between pt-2 border-t border-surface-100">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="lg:col-span-1">
            {paymentMethod === 'upi' && (
              <div className="space-y-5">
                <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 flex flex-col sm:flex-row items-center gap-5">
                  <img
                    src={`upi://pay?pa=${UPI_ID}&pn=Speedersmania&am=${total.toFixed(2)}&cu=INR&tn=Order ${cart.length} item(s)`}
                    alt="UPI QR Code"
                    className="h-36 w-36 rounded-xl bg-white p-2 border border-surface-100" />
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
                        title="Copy UPI ID">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-primary-700">Amount to pay: ₹{total.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">UPI Transaction Reference (UTR)</label>
                  <input
                    name="utr"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.toUpperCase())}
                    placeholder="e.g. 412345678901"
                    className="input-field uppercase"
                    required={paymentMethod === 'upi'} />
                  <p className="mt-1.5 text-xs text-surface-500">
                    After paying, your bank app shows a 12-digit UTR. Enter it here to complete the order. We'll verify it manually within 24 hours.
                  </div>
                </div>
              )}
            )}

            {paymentMethod === 'cod' && (
              <div className="rounded-xl bg-surface-50 border border-surface-100 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-600">Advance (pay now)</span>
                  <span className="font-semibold text-surface-900">₹{codAdvance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600">Payable on delivery</span>
                  <span className="font-semibold text-surface-900">₹{(total - codAdvance).toFixed(2)}</span>
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
                    title="Copy UPI ID">
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
                    className="input-field uppercase" />
                </div>
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={processing} className="btn-primary w-full mt-6">
          {processing ? 'Processing...' : paymentMethod === 'upi' ? 'Place Order ₹' + total.toFixed(2) : paymentMethod === 'cod' ? 'Place Order ₹' + codAdvance.toFixed(2) : 'Place Order ₹' + total.toFixed(2)}
        </button>
      </form>
    </div>
  );
}