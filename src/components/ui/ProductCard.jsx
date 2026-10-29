import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Zap, BadgeCheck, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCheckoutInterceptor } from '../../context/CheckoutInterceptorContext';
import { useAuth } from '../../context/AuthContext';
import { trackEvent } from '../../config/analytics';
import { TiltCard } from './Motion';

/* Indian price formatting: ₹24,999 and ₹149.50 — no trailing ".00". */
const inr = (value) => {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function ProductCard({ product, view = 'grid' }) {
  const { addItem } = useCart();
  const { intercept } = useCheckoutInterceptor();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const image =
    product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/600/600`;
  const price = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice) || 0;
  const rating = Number(product.rating) || 4.5;
  const reviewCount = Number(product.reviewCount) || 0;
  const discount =
    Number(product.discount) ||
    (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

  const isVerifiedVendor = product.verified || product.isVerified || false;
  const vendorName = product.vendorName || 'Speedersmania';
  const hasDiscount = originalPrice > price;

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

  const media = (
    <>
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-100 via-surface-50 to-surface-200"
      >
        <ShoppingBag className="h-9 w-9 text-surface-300" />
      </div>
      {imageFailed ? (
        <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-100 to-surface-200">
          <ShoppingBag className="h-10 w-10 text-surface-300" aria-hidden />
        </div>
      ) : (
        <img
          src={image}
          alt={product.name}
          onError={() => setImageFailed(true)}
          className="relative h-full w-full object-cover transition-transform duration-700 ease-smooth group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      )}
    </>
  );

  const badges = (product.badge || discount > 0) && (
    <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%_-_4.5rem)] flex-col items-start gap-2 sm:left-4 sm:top-4">
      {product.badge && (
        <span className="max-w-full truncate rounded-full bg-primary-600/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-sm">
          {product.badge}
        </span>
      )}
      {discount > 0 && (
        <span className="rounded-full bg-danger px-3 py-1 text-xs font-bold text-white shadow-sm">
          -{discount}%
        </span>
      )}
    </div>
  );

  const wishlistButton = (
    <button
      onClick={handleWishlist}
      disabled={wishBusy}
      className={`flex h-9 w-9 items-center justify-center rounded-full shadow-card backdrop-blur-md transition-all duration-300 active:scale-90 sm:h-10 sm:w-10 ${
        wished
          ? 'bg-danger text-white hover:bg-danger/90'
          : 'bg-white/90 text-ink-soft opacity-100 hover:text-danger md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0'
      }`}
      title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${wished ? 'fill-current' : ''}`} />
    </button>
  );

  /* Price + actions. `min-w-0` lets the price shrink; the old price wraps to a
     second line instead of colliding with the buttons on narrow cards. */
  const footer = (
    <div className="mt-auto flex items-end justify-between gap-2 border-t border-surface-200/60 pt-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="whitespace-nowrap text-lg font-bold leading-tight text-ink sm:text-xl">
            {inr(price)}
          </span>
          {hasDiscount && (
            <span className="whitespace-nowrap text-xs text-ink-muted line-through sm:text-sm">
              {inr(originalPrice)}
            </span>
          )}
        </div>
        {hasDiscount ? (
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">
            Save {inr(originalPrice - price)}
          </p>
        ) : (
          <p className="mt-0.5 text-[11px] font-semibold text-transparent" aria-hidden>&nbsp;</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {view === 'list' && (
          <button
            onClick={handleAddToCart}
            className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-semibold text-white transition-all hover:bg-primary-600 active:scale-95"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to cart
          </button>
        )}
        {view === 'grid' && (
          <button
            onClick={handleAddToCart}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 text-ink-soft transition-all hover:bg-primary-600 hover:text-white active:scale-90"
            title="Add to cart"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleBuyNow}
          className="group/buy flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-primary-950 transition-all hover:shadow-glow-accent active:scale-90"
          title="Buy now"
          aria-label="Buy now"
        >
          <Zap className="h-4 w-4 transition-transform duration-300 group-hover/buy:scale-110" />
        </button>
      </div>
    </div>
  );

  const ratingRow = (
    <div className="flex min-h-[1.25rem] items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-xs font-semibold text-ink">
        {reviewCount > 0 ? rating.toFixed(1) : 'New'}
      </span>
      {reviewCount > 0 && <span className="text-xs text-ink-muted">({reviewCount})</span>}
    </div>
  );

  if (view === 'list') {
    return (
      <TiltCard
        className="card-flat group flex h-full flex-col overflow-hidden sm:flex-row"
        intensity={0}
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-100 sm:aspect-auto sm:w-56 lg:w-64">
          <Link to={`/products/${product.id}`} aria-label={product.name} className="absolute inset-0 block">
            {media}
          </Link>
          {badges}
          <div className="absolute right-3 top-3 sm:right-4 sm:top-4">{wishlistButton}</div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
          <Link to={`/products/${product.id}`} className="block min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary-600">
              <span className="truncate">{vendorName}</span>
              {isVerifiedVendor && (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-label="Verified vendor" />
              )}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-ink transition-colors group-hover:text-primary-700 sm:text-lg">
              {product.name}
            </h3>
          </Link>

          {product.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted sm:text-sm">
              {product.description}
            </p>
          )}

          {ratingRow}
          {footer}
        </div>
      </TiltCard>
    );
  }

  return (
    <TiltCard className="card-flat group flex h-full flex-col overflow-hidden" intensity={8}>
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-100">
        <Link to={`/products/${product.id}`} aria-label={product.name} className="block h-full w-full">
          {media}
        </Link>

        {/* Scrim + quick add: visible on touch by default, hover-revealed on desktop. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/5 to-transparent opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100" />

        {badges}

        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">{wishlistButton}</div>

        <div className="absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition-all duration-500 sm:inset-x-4 sm:bottom-4 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <button
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-xs font-semibold text-primary-700 shadow-card backdrop-blur-sm transition-all hover:bg-primary-600 hover:text-white active:scale-[0.98] sm:py-3 sm:text-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to cart
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <Link to={`/products/${product.id}`} className="block min-w-0">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary-600">
            <span className="truncate">{vendorName}</span>
            {isVerifiedVendor && (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-label="Verified vendor" />
            )}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-[2.75em] text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-primary-700">
            {product.name}
          </h3>
        </Link>

        {ratingRow}
        {footer}
      </div>
    </TiltCard>
  );
}
