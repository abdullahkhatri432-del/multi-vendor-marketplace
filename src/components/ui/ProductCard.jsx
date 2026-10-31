import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Zap, BadgeCheck, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCheckoutInterceptor } from '../../context/CheckoutInterceptorContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { trackEvent } from '../../config/analytics';
import { prefetchProduct } from '../../config/firestore';
import { TiltCard } from './Motion';
import { inr } from '../../utils/currency';

export default function ProductCard({ product, view = 'grid' }) {
  const { addItem } = useCart();
  const { intercept } = useCheckoutInterceptor();
  const { user } = useAuth();
  const { isWished, toggleWishlist, busyIds } = useWishlist();
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const wished = isWished(product.id);
  const wishBusy = busyIds.includes(product.id);

  const image =
    product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/600/600`;
  const price = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice) || 0;
  const rating = Number(product.rating) || 4.5;
  const reviewCount = Number(product.reviewCount) || 0;
  const rawDiscount =
    Number(product.discount) ||
    (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  // Bad data (negative or >100) must never reach the badge.
  const discount = Math.max(0, Math.min(99, Math.round(rawDiscount) || 0));

  const isVerifiedVendor = product.verified || product.isVerified || false;
  const vendorName = product.vendorName || 'Speedersmania';
  const hasDiscount = originalPrice > price;

  // Give a new image a fresh chance to load when the card is recycled.
  useEffect(() => {
    setImageFailed(false);
    setImageLoaded(false);
  }, [image]);

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
      // `intercept` resolves with the freshly signed-in user (or undefined when
      // already authenticated), so the write can complete in the same click.
      const authedUser = await intercept('wishlist', { productId: product.id });
      await toggleWishlist(product.id, authedUser?.uid || user?.uid);
    } catch (err) {
      if (err.message !== 'Authentication cancelled') {
        console.error('Wishlist toggle failed:', err);
      }
    }
  };

  const media = (
    <div className="absolute inset-0 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-100 via-surface-50 to-surface-200"
      >
        <ShoppingBag className="h-8 w-8 text-surface-300 sm:h-9 sm:w-9" />
      </div>
      {imageFailed ? (
        <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-100 to-surface-200">
          <ShoppingBag className="h-8 w-8 text-surface-300 sm:h-10 sm:w-10" aria-hidden />
        </div>
      ) : (
        <img
          src={image}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
          className={`relative h-full w-full object-cover transition-[transform,opacity] duration-700 ease-smooth group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );

  const badges = (product.badge || discount > 0) && (
    <div className="pointer-events-none absolute left-2.5 top-2.5 flex max-w-[calc(100%_-_3.5rem)] flex-col items-start gap-1.5 sm:left-3.5 sm:top-3.5">
      {product.badge && (
        <span className="max-w-full truncate rounded-full bg-primary-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md sm:px-3 sm:py-1 sm:text-[11px]">
          {product.badge}
        </span>
      )}
      {discount > 0 && (
        <span className="rounded-full bg-danger px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm sm:px-3 sm:py-1 sm:text-xs">
          −{discount}%
        </span>
      )}
    </div>
  );

  const wishlistButton = (
    <button
      type="button"
      onClick={handleWishlist}
      disabled={wishBusy}
      aria-pressed={wished}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full shadow-card backdrop-blur-md transition-all duration-300 after:absolute after:-inset-1 after:rounded-full after:content-[''] active:scale-90 disabled:opacity-70 sm:h-9 sm:w-9 md:h-10 md:w-10 ${
        wished
          ? 'bg-danger text-white hover:bg-danger/90'
          : 'bg-white/90 text-ink-soft hover:text-danger md:-translate-x-2 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100'
      }`}
      title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${wished ? 'fill-current' : ''}`} />
    </button>
  );

  const ratingRow = (
    <div className="flex min-h-[1.1rem] items-center gap-1">
      <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400 sm:h-3.5 sm:w-3.5" />
      <span className="text-[11px] font-semibold text-ink sm:text-xs">
        {reviewCount > 0 ? rating.toFixed(1) : 'New'}
      </span>
      {reviewCount > 0 && (
        <span className="truncate text-[11px] text-ink-muted sm:text-xs">({reviewCount})</span>
      )}
    </div>
  );

  /* Price + actions. `min-w-0` lets the price shrink; the old price wraps to a
     second line instead of colliding with the buttons on narrow cards. */
  const priceBlock = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="whitespace-nowrap text-sm font-bold leading-tight text-ink sm:text-base md:text-lg">
          {inr(price)}
        </span>
        {hasDiscount && (
          <span className="whitespace-nowrap text-[10px] text-ink-muted line-through sm:text-xs">
            {inr(originalPrice)}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[10px] font-semibold text-emerald-600 sm:text-[11px]">
        {hasDiscount ? `Save ${inr(originalPrice - price)}` : '\u00A0'}
      </p>
    </div>
  );

  const actionButtons = (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      {view === 'list' && (
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex min-h-[36px] items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-semibold text-white transition-all hover:bg-primary-600 active:scale-95 sm:px-4"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add to cart
        </button>
      )}
      {view === 'grid' && (
        <button
          type="button"
          onClick={handleAddToCart}
          className="relative hidden h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-ink-soft transition-all after:absolute after:-inset-1 after:rounded-full after:content-[''] hover:bg-primary-600 hover:text-white active:scale-90 sm:flex sm:h-9 sm:w-9"
          title="Add to cart"
          aria-label="Add to cart"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={handleBuyNow}
        className="group/buy relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-primary-950 transition-all after:absolute after:-inset-1 after:rounded-full after:content-[''] hover:shadow-glow-accent active:scale-90 sm:h-9 sm:w-9"
        title="Buy now"
        aria-label="Buy now"
      >
        <Zap className="h-3.5 w-3.5 transition-transform duration-300 group-hover/buy:scale-110 sm:h-4 sm:w-4" />
      </button>
    </div>
  );

  const vendorLine = (
    <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-primary-600 sm:text-[10px] sm:tracking-widest">
      <span className="truncate">{vendorName}</span>
      {isVerifiedVendor && (
        <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-label="Verified vendor" />
      )}
    </p>
  );

  if (view === 'list') {
    return (
      <TiltCard
        className="card-flat group flex h-full flex-col overflow-hidden transition-shadow duration-500 hover:border-surface-300 hover:shadow-card sm:flex-row"
        intensity={0}
        onMouseEnter={() => prefetchProduct(product.id)}
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-100 sm:aspect-auto sm:w-48 lg:w-64">
          <Link
            to={`/products/${product.id}`}
            aria-label={product.name}
            className="absolute inset-0 block"
          >
            {media}
          </Link>
          {badges}
          <div className="absolute right-2.5 top-2.5 sm:right-3.5 sm:top-3.5">{wishlistButton}</div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
          <Link to={`/products/${product.id}`} className="block min-w-0">
            {vendorLine}
            <h3 className="mt-1 line-clamp-2 min-h-[2.6em] text-base font-semibold leading-snug text-ink transition-colors group-hover:text-primary-700 sm:text-lg">
              {product.name}
            </h3>
          </Link>

          {product.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted sm:text-sm">
              {product.description}
            </p>
          )}

          {ratingRow}

          <div className="mt-auto flex items-end justify-between gap-2 border-t border-surface-200/60 pt-3">
            {priceBlock}
            {actionButtons}
          </div>
        </div>
      </TiltCard>
    );
  }

  return (
    <TiltCard
      className="card-flat group flex h-full flex-col overflow-hidden transition-shadow duration-500 hover:border-surface-300 hover:shadow-card"
      intensity={8}
      onMouseEnter={() => prefetchProduct(product.id)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-100">
        <Link
          to={`/products/${product.id}`}
          aria-label={product.name}
          className="block h-full w-full"
        >
          {media}
        </Link>

        {/* Scrim + quick add: visible on touch by default, hover-revealed on desktop. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/5 to-transparent opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100" />

        {badges}

        <div className="absolute right-2.5 top-2.5 sm:right-3.5 sm:top-3.5">{wishlistButton}</div>

        <div className="absolute inset-x-2.5 bottom-2.5 translate-y-0 opacity-100 transition-all duration-500 sm:inset-x-3.5 sm:bottom-3.5 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/95 py-2 text-[11px] font-semibold text-primary-700 shadow-card backdrop-blur-sm transition-all hover:bg-primary-600 hover:text-white active:scale-[0.98] sm:py-2.5 sm:text-xs md:text-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Add to cart
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4 md:p-5">
        <Link to={`/products/${product.id}`} className="block min-w-0">
          {vendorLine}
          <h3 className="mt-1 line-clamp-2 min-h-[2.7em] text-[13px] font-semibold leading-snug text-ink transition-colors group-hover:text-primary-700 sm:text-sm md:text-base">
            {product.name}
          </h3>
        </Link>

        {ratingRow}

        <div className="mt-auto flex items-end justify-between gap-1.5 border-t border-surface-200/60 pt-2.5 sm:gap-2 sm:pt-3">
          {priceBlock}
          {actionButtons}
        </div>
      </div>
    </TiltCard>
  );
}
