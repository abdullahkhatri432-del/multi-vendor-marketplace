import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckoutInterceptor } from '../context/CheckoutInterceptorContext';
import EmptyState from '../components/ui/EmptyState';

export default function CartPage() {
  const { cart, removeItem, updateQuantity, cartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { intercept } = useCheckoutInterceptor();
  const navigate = useNavigate();

  const shipping = cartTotal > 50 ? 0 : 5.99;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shipping + tax;

  const handleCheckout = async () => {
    try {
      // Intercept will handle auth if needed, then redirect to checkout
      await intercept('checkout');
      navigate('/checkout');
    } catch (err) {
      // User cancelled auth - stay on cart page
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-surface-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="card p-4 flex gap-4 animate-fade-in">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-100">
                <img
                  src={item.image || `https://picsum.photos/seed/${item.id}/100/100`}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.id}`} className="text-sm font-semibold text-surface-900 hover:text-primary-600 transition-colors line-clamp-1">
                  {item.name}
                </Link>
                <p className="text-xs text-surface-500 mt-0.5">{item.vendorName}</p>
                {item.addons && item.addons.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.addons.map((addon, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-surface-500">✔️ {addon.title}</span>
                        <span className="text-primary-600">₹{addon.price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-surface-200 bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-surface-400 hover:text-surface-700"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-surface-400 hover:text-surface-700"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-surface-900 block">
                      ${(item.price * item.quantity + (item.addonTotal || 0)).toFixed(2)}
                    </span>
                    {item.addons && item.addons.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-surface-400">Add-ons:</span>
                        <span className="text-xs text-primary-600">+{item.addonTotal?.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors self-start"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button onClick={clearCart} className="btn-ghost text-sm text-red-500 hover:bg-red-50">
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Subtotal ({cart.length} items)</span>
                <span className="font-medium text-surface-900">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Shipping</span>
                <span className="font-medium text-surface-900">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Tax (8%)</span>
                <span className="font-medium text-surface-900">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-surface-100 pt-3 flex justify-between">
                <span className="text-base font-semibold text-surface-900">Total</span>
                <span className="text-base font-bold text-surface-900">${total.toFixed(2)}</span>
              </div>
            </div>

            {cartTotal < 50 && (
              <p className="mt-4 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Add ${(50 - cartTotal).toFixed(2)} more for free shipping!
              </p>
            )}

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
          </div>
        </div>
      </div>
    </div>
  );
}