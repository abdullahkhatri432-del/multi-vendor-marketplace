import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Bolt, BadgeCheck, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCheckoutInterceptor } from '../../context/CheckoutInterceptorContext';
import { useAuth } from '../../context/AuthContext';
import { trackEvent } from '../../config/analytics';
import { TiltCard } from './Motion';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { intercept } = useCheckoutInterceptor();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const image = product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/600/600`;

  const price = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice) || 0;
  const rating = Number(product.rating) || 4.5;
  const reviewCount = Number(product.reviewCount) || 0;
  const discount = Number(product.discount) || (
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  );

  const isVerifiedVendor = product.verified || product.isVerified || false;

  const handleAddToCart = () => {
    trackEvent('add_to_cart', {
      items: [{ item_id: product.id, item_name: product.name, price, quantity: 1 }],
      value: price,
    });
    addItem(product);
  };

  const handleBuyNow = async () => {
    try {
      await intercept('buy_now', { productId: product.id, quantity: 1 });
      addItem(product);
      navigate('/checkout');
    } catch (err) {
      if (err.message !== 'Authentication cancelled') {
        console.error('Buy now intercept failed:', err);
      }
    }
  };

  const handleWishlist = async () => {
    try {
      await intercept('wishlist', { productId: product.id });
      if (!user?.uid) return;
      setWishBusy(true);
      if (wished) {
        setWished(false);
      } else {
        setWished(true);
      }
    } catch (err) {
      if (err.message !== 'Authentication cancelled') {
        console.error('Wishlist toggle failed:', err);
      }
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <TiltCard className="card-flat group flex h-full animate-fade-in flex-col overflow-hidden" intensity={8}>
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-100">
        <Link to={`/products/${product.id}`} aria-label={product.name}>
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-1000 ease-smooth group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Quick actions */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <button
            onClick={handleWishlist}
            disabled={wishBusy}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-card backdrop-blur-md transition-all duration-300 active:scale-90 ${
              wished
                ? 'bg-danger text-white hover:bg-danger/90'
                : 'bg-white/90 text-ink-soft opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 hover:text-danger'
            }`}
            title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-5 w-5 ${wished ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {product.badge && (
            <span className="w-fit rounded-full bg-primary-600/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-sm">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="w-fit rounded-full bg-danger px-3 py-1 text-xs font-bold text-white shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {/* Hover CTA */}
        <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/95 py-3 text-sm font-semibold text-primary-700 shadow-card backdrop-blur-sm transition-all hover:bg-primary-600 hover:text-white active:scale-[0.98]"
          >
            <ShoppingCart className="h-4 w-4" />
            Quick Add to Cart
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link to={`/products/${product.id}`}>
          <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary-600">
            {product.vendorName || 'Speedersmania'}
            {isVerifiedVendor && (
              <BadgeCheck className="h-3.5 w-3.5 text-primary-600" aria-label="Verified vendor" />
            )}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-primary-700">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-ink">
            {reviewCount > 0 ? rating.toFixed(1) : 'New'}
          </span>
          {reviewCount > 0 && <span className="text-xs text-ink-muted">({reviewCount})</span>}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-surface-200/40 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-ink">₹{price.toFixed(2)}</span>
            {originalPrice > price && (
              <span className="text-sm text-ink-muted line-through">₹{originalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBuyNow}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark text-primary-950 transition-all hover:shadow-glow-accent active:scale-90"
              title="Buy Now"
              aria-label="Buy now"
            >
              <Bolt className="h-4 w-4" />
            </button>
            <Link
              to={`/products/${product.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100 text-ink-muted transition-all hover:bg-primary-50 hover:text-primary-600 active:scale-90"
              title="View Details"
              aria-label="View product details"
            >
              <Eye className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
