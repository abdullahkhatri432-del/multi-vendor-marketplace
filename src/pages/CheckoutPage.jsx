import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, MapPin, AlertCircle, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckoutInterceptor } from '../context/CheckoutInterceptorContext';
import { createOrder, incrementProductSold, incrementVendorSales } from '../config/firestore';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { intercept } = useCheckoutInterceptor();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const shipping = cartTotal > 50 ? 0 : 5.99;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shipping + tax;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
        subtotal: cartTotal,
        shipping,
        tax,
        total,
        paymentMethod: 'card',
        paymentStatus: 'completed',
      };

      const newOrderId = await createOrder(orderData);

      for (const item of cart) {
        await incrementProductSold(item.id, item.quantity);
        if (item.vendorId) {
          await incrementVendorSales(item.vendorId, item.price * item.quantity);
        }
      }

      setOrderId(newOrderId);
      setOrderComplete(true);
      clearCart();
    } catch (err) {
      console.error('Order failed:', err);
      setError('Failed to place order. Please try again.');
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
          <Phone className="h-10 w-10 text-primary-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-surface-900">Sign in to Complete Purchase</h1>
        <p className="mt-4 text-surface-500 max-w-md mx-auto">
          To securely process your order, please verify your phone number. We'll send a 6-digit code to authenticate your purchase.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => handleSubmit({ preventDefault: () => {} })}
            className="btn-primary"
          >
            Continue with Phone Verification
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="cardNumber" value={form.cardNumber} onChange={handleChange} placeholder="Card Number" className="input-field sm:col-span-2" required />
                <input name="cardExpiry" value={form.cardExpiry} onChange={handleChange} placeholder="MM/YY" className="input-field" required />
                <input name="cardCvc" value={form.cardCvc} onChange={handleChange} placeholder="CVC" className="input-field" required />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-surface-500">
                <Lock className="h-3.5 w-3.5" />
                Your payment information is encrypted and secure
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Order Summary</h3>
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
                      ${(item.price * item.quantity + (item.addonTotal || 0)).toFixed(2)}
                    </span>
                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-1 text-[10px] text-primary-600">
                        +{item.addonTotal?.toFixed(2)} add-ons
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-surface-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-500">Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-surface-100">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
              <button type="submit" disabled={processing} className="btn-primary w-full mt-6">
                {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}