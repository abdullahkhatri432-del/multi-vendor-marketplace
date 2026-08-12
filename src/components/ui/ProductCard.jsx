import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Bolt, BadgeCheck, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCheckoutInterceptor } from '../../context/CheckoutInterceptorContext';
import { getVendorsMap, getWishlist, addToWishlist, removeFromWishlist } from '../../config/firestore';
import { trackEvent } from '../../config/analytics';
import { useAuth } from '../../context/AuthContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { intercept } = useCheckoutInterceptor();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [vendorsMap, setVendorsMap] = useState(null);
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const image = product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/400/400`;

  useEffect(() => {
    getVendorsMap().then(setVendorsMap).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      getWishlist(user.uid)
        .then((ids) => setWished(Array.isArray(ids) && ids.includes(product.id)))
        .catch(() => {});
    } else {
      setWished(false);
    }
  }, [isAuthenticated, user, product.id]);

  const isVerifiedVendor = !!(vendorsMap && vendorsMap[product.vendorId]?.verified);

  const handleAddToCart = () => {
    trackEvent('add_to_cart', {
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }],
      value: product.price || 0,
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
        await removeFromWishlist(user.uid, product.id);
        setWished(false);
      } else {
        await addToWishlist(user.uid, product.id);
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
    <div className="group card overflow-hidden animate-fade-in flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-surface-100">
        <Link to={`/products/${product.id}`} aria-label={product.name}>
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick actions */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            onClick={handleWishlist}
            disabled={wishBusy}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-soft backdrop-blur-sm transition-all duration-300 active:scale-90 ${
              wished
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/90 text-surface-500 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 hover:text-red-500'
            }`}
            title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-4 w-4 ${wished ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.badge && (
            <span className="w-fit rounded-full bg-primary-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm shadow-sm">
              {product.badge}
            </span>
          )}
          {product.discount > 0 && (
            <span className="w-fit rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              -{product.discount}%
            </span>
          )}
        </div>

        {/* Hover CTA */}
        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/95 py-2.5 text-sm font-semibold text-primary-700 shadow-premium backdrop-blur-sm transition-all hover:bg-primary-600 hover:text-white active:scale-[0.98]"
          >
            <ShoppingCart className="h-4 w-4" />
            Quick Add to Cart
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/products/${product.id}`}>
          <p className="mb-1 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-primary-600">
            {product.vendorName || 'NexusMart'}
            {isVerifiedVendor && (
              <BadgeCheck className="h-3.5 w-3.5 text-primary-600" aria-label="Verified vendor" />
            )}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-surface-900 transition-colors group-hover:text-primary-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-surface-700">{product.rating?.toFixed(1) || '4.5'}</span>
          <span className="text-xs text-surface-400">({product.reviewCount || 0})</span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-surface-100 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-surface-900">₹{product.price?.toFixed(2)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-surface-400 line-through">₹{product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBuyNow}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-90"
              title="Buy Now"
              aria-label="Buy now"
            >
              <Bolt className="h-4 w-4" />
            </button>
            <Link
              to={`/products/${product.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-100 text-surface-600 transition-all hover:bg-primary-50 hover:text-primary-600 active:scale-90"
              title="View Details"
              aria-label="View product details"
            >
              <Eye className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
