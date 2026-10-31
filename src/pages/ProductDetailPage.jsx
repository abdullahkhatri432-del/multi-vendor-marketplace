import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Truck, Shield, RotateCcw, Heart, ArrowLeft, Minus, Plus, Store, Send, BadgeCheck, Zap, ChevronRight, Check, Package, Sparkles } from 'lucide-react';
import { getProduct, getVendor, getReviewsByProduct, getOrdersByUser, getProductsByCategory } from '../config/firestore';
import { saveReview } from '../config/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCheckoutInterceptor } from '../context/CheckoutInterceptorContext';
import { trackEvent } from '../config/analytics';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProductCard from '../components/ui/ProductCard';
import { inr } from '../utils/currency';

import usePageMeta from '../hooks/usePageMeta';
const RECENT_KEY = 'speedersmania_recently_viewed';
const MAX_RECENT = 8;

const trackRecent = (id) => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const next = [id, ...list.filter((x) => x !== id)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { isWished, toggleWishlist, busyIds } = useWishlist();
  const { intercept } = useCheckoutInterceptor();
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [purchasedProductIds, setPurchasedProductIds] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  usePageMeta({
    title: product ? `${product.name} — Speedersmania` : 'Product — Speedersmania',
    description: product
      ? (product.description || `Buy ${product.name} from a verified seller on Speedersmania.`).slice(0, 300)
      : 'Product details on Speedersmania.',
    path: product ? `/products/${product.id}` : undefined,
    image: product?.images?.[0] || product?.image,
    type: 'product',
  });

  const stock = Number.isFinite(Number(product?.stock)) ? Math.max(0, Number(product.stock)) : null;
  const isOutOfStock = stock === 0;
  const maxQuantity = stock ?? 99;
  const isInWishlist = isWished(id);
  const wishBusy = busyIds.includes(id);

  useEffect(() => {
    // Clamp quantity whenever stock changes (e.g. product reloads).
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, maxQuantity)));
  }, [maxQuantity]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prod = await getProduct(id);
        if (prod) {
          setProduct(prod);
          trackRecent(id);
          if (prod.vendorId) {
            const vend = await getVendor(prod.vendorId);
            setVendor(vend);
          }
          if (prod.category) {
            try {
              const related = await getProductsByCategory(prod.category);
              setRelatedProducts((related || []).filter((p) => p.id !== id).slice(0, 4));
            } catch (err) {
              console.error('Failed to load related products:', err);
            }
          }
        }
        const revs = await getReviewsByProduct(id);
        setReviews(revs);
        if (user) {
          try {
            const userOrders = await getOrdersByUser(user.uid);
            const purchased = new Set();
            userOrders.forEach((o) =>
              (o.items || []).forEach((it) => {
                if (it.productId === id) purchased.add(o.id);
              })
            );
            setPurchasedProductIds([...purchased]);
          } catch (err) {
            console.error('Failed to load purchase history:', err);
          }
        }
      } catch (err) { console.error('Failed to fetch product:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, user]);

  // Structured data (Product + Offer) and the view_item analytics event.
  // Availability and ratings reflect real data only — no invented values.
  useEffect(() => {
    if (!product) return undefined;

    const stockValue = Number(product.stock);
    const availability = Number.isFinite(stockValue) && stockValue <= 0
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock';

    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.images?.length ? product.images : [product.image || '/product-placeholder.svg'],
      description: product.description || undefined,
      sku: product.id,
      brand: { '@type': 'Organization', name: product.vendorName || 'Speedersmania' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: Number(product.price) || 0,
        availability,
        url: `${window.location.origin}/products/${product.id}`,
      },
    };

    // Only publish an aggregate rating when genuine reviews exist.
    if (reviews.length > 0) {
      const ratings = reviews.map((r) => Number(r.rating)).filter((n) => n >= 1 && n <= 5);
      if (ratings.length > 0) {
        data.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
          reviewCount: ratings.length,
        };
      }
    }

    let script = document.getElementById('product-ld-json');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'product-ld-json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(data);
  }, [product, reviews]);

  // Fire the analytics event once per product view (not on review updates).
  useEffect(() => {
    if (!product) return;
    trackEvent('view_item', {
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }],
      value: product.price || 0,
    });
  }, [product]);

  const handleAddToCart = () => {
    // Guests can hold a cart (checkout is gated later), matching product cards.
    if (isOutOfStock) return;
    const qty = Math.min(quantity, maxQuantity);
    trackEvent('add_to_cart', {
      items: [{ item_id: id, item_name: product.name, price: product.price, quantity: qty }],
      value: (product.price || 0) * qty,
    });
    addItem(product, qty, selectedAddons);
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    const qty = Math.min(quantity, maxQuantity);
    try {
      await intercept('buy_now', { productId: id, quantity: qty, selectedAddons });
      addItem(product, qty, selectedAddons);
      navigate('/checkout');
    } catch (err) {
      if (err.message !== 'Authentication cancelled') {
        console.error('Buy now intercept failed:', err);
      }
    }
  };

  const handleAddonToggle = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleToggleWishlist = async () => {
    try {
      const authedUser = await intercept('wishlist', { productId: id });
      await toggleWishlist(id, authedUser?.uid || user?.uid);
    } catch (err) {
      if (err.message !== 'Authentication cancelled') {
        console.error('Wishlist toggle failed:', err);
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!reviewForm.comment.trim()) {
      setReviewError('Please write a short review before submitting.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    try {
      // Server verifies the purchase, prevents duplicate reviews and recomputes
      // the product's rating. Never trust a client-side "verified" flag.
      await saveReview(user, {
        productId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      const revs = await getReviewsByProduct(id);
      setReviews(revs);
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewError(err?.message || 'Could not save your review. Please try again.');
    }
    setSubmittingReview(false);
  };

  if (loading) return <LoadingSpinner size="lg" className="py-32" />;
  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-surface-900">Product Not Found</h2>
        <Link to="/products" className="btn-primary mt-6">Browse Products</Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.image || '/product-placeholder.svg'];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : (Number(product.rating) || 4.5).toFixed(1);
  // Cards show a lifetime review count; until reviews exist in Firestore, fall
  // back to it so the rating line doesn't contradict the product card.
  const reviewTotal = reviews.length > 0 ? reviews.length : product.reviewCount || 0;
  const totalPrice = (product.price || 0) * quantity + selectedAddons.reduce((sum, addon) => sum + (addon.price || 0) * quantity, 0);
  const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const ratingDist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-4"><ArrowLeft className="h-4 w-4" /> Back</button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-surface-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/products" className="hover:text-primary-600 transition-colors">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/products?category=${product.category}`} className="hover:text-primary-600 transition-colors capitalize">
              {product.category}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-surface-700 font-medium line-clamp-1 max-w-[180px] sm:max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4 reveal-scale">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-surface-100">
            <img
              key={selectedImage}
              src={images[selectedImage]}
              alt={product.name}
              className="h-full w-full object-cover anim-scale"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 rounded-full bg-primary-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                {product.badge}
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 stagger">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition-all ${i === selectedImage ? 'border-primary-500 shadow-glow' : 'border-surface-200'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col reveal-right">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge-primary">{product.category || 'General'}</span>
            {product.discount > 0 && <span className="badge-danger">-{product.discount}% OFF</span>}
          </div>

          <h1 className="text-fluid-title font-display font-bold text-surface-900 leading-tight">{product.name}</h1>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}`} />
              ))}
            </div>
            <span className="text-sm text-surface-500">{avgRating} ({reviewTotal} reviews)</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              product.stock === 0
                ? 'bg-red-50 text-red-600'
                : product.stock > 0 && product.stock <= 10
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
            }`}>
              {product.stock === 0
                ? (<><Package className="h-3 w-3" /> Out of Stock</>)
                : product.stock > 0 && product.stock <= 10
                  ? (<><Package className="h-3 w-3" /> Only {product.stock} left</>)
                  : (<><Check className="h-3 w-3" /> In Stock</>)}
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-surface-900">{inr(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-surface-400 line-through">{inr(product.originalPrice)}</span>
            )}
          </div>

          <p className="mt-6 text-surface-600 leading-relaxed">{product.description}</p>

          {/* Add-ons Section */}
          {product.addons && product.addons.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Available Add-ons</h3>
              <div className="space-y-3 stagger">
                {product.addons.map((addon, index) => {
                  const addonId = addon.id || `addon-${index}`;
                  const isSelected = selectedAddons.some((a) => (a.id || `addon-${product.addons.indexOf(a)}`) === addonId);
                  return (
                    <label key={addonId} className="flex items-center justify-between p-4 rounded-xl border border-surface-200 cursor-pointer hover:border-primary-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleAddonToggle({ ...addon, id: addonId })}
                          className="h-5 w-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-surface-900">✔️ {addon.title}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary-600">{inr(addon.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-surface-500">Base Price:</span>
              <span className="text-lg font-bold text-surface-900">{inr(product.price)}</span>
            </div>
            {selectedAddons.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-surface-500">Add-ons:</span>
                <span className="text-lg font-bold text-primary-600">
                  +{inr(selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0))}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-surface-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-surface-600">Total for {quantity}×:</span>
                <span className="text-2xl font-bold text-surface-900">
                  {inr(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {vendor && (
            <Link to={`/products?vendor=${product.vendorId}`} className="mt-6 flex items-center gap-3 rounded-2xl border border-surface-100 p-4 hover:border-primary-200 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50"><Store className="h-6 w-6 text-primary-600" /></div>
              <div>
                <p className="text-sm font-semibold text-surface-900 inline-flex items-center gap-1">
                  {vendor.storeName}
                  {vendor.verified && <BadgeCheck className="h-4 w-4 text-primary-600" aria-label="Verified vendor" />}
                </p>
                <p className="text-xs text-surface-500">{vendor.totalSales || 0} sales</p>
              </div>
            </Link>
          )}

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-50 px-4 py-3 text-sm text-surface-600 anim-rise">
            <Zap className="h-4 w-4 text-primary-600" />
            Estimated delivery by <span className="font-semibold text-surface-800">{deliveryDate}</span> · 2-4 business days
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center rounded-xl border border-surface-200 bg-white">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="flex h-11 w-11 items-center justify-center text-surface-500 hover:text-surface-900 disabled:opacity-40 disabled:cursor-not-allowed"><Minus className="h-4 w-4" /></button>
              <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))} disabled={quantity >= maxQuantity} className="flex h-11 w-11 items-center justify-center text-surface-500 hover:text-surface-900 disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={handleBuyNow} disabled={isOutOfStock} className="btn-secondary flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              <Truck className="h-5 w-5 mr-2" />
              Buy Now
            </button>
            <button onClick={handleAddToCart} disabled={isOutOfStock} className="btn-primary flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"><ShoppingCart className="h-5 w-5" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</button>
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishBusy}
              aria-pressed={isInWishlist}
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-60 ${isInWishlist ? 'border-red-200 bg-red-50 text-red-500' : 'border-surface-200 text-surface-400 hover:text-red-500 hover:border-red-200'}`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 stagger">
            {[{ icon: Truck, label: 'Free Shipping' }, { icon: Shield, label: 'Secure Payment' }, { icon: RotateCcw, label: 'Easy Returns' }].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-surface-50 p-4 text-center">
                <Icon className="h-5 w-5 text-primary-600" />
                <span className="text-xs font-medium text-surface-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contextual Product Bundling / Complete the Look */}
      {relatedProducts.length >= 2 && (
        <section className="mt-16 reveal rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50/60 via-white to-primary-50/30 p-6 lg:p-8 shadow-soft">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700 mb-3">
                <Sparkles className="h-3.5 w-3.5" /> Bundle & Save
              </div>
              <h3 className="text-2xl font-display font-bold text-surface-900">Complete the Look</h3>
              <p className="mt-1 text-sm text-surface-600 max-w-xl">
                Grab this item together with the top matching items below for a curated bundle experience.
              </p>
            </div>
            <button
              onClick={() => {
                addItem(product, 1);
                relatedProducts.slice(0, 2).forEach((p) => addItem(p, 1));
                trackEvent('add_bundle', { product_id: product.id });
                alert('Bundle added to cart successfully!');
              }}
              className="btn-primary shrink-0"
            >
              <ShoppingCart className="h-4 w-4" /> Add Bundle to Cart
            </button>
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 reveal">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-surface-900">You May Also Like</h2>
            <Link to={`/products?category=${product.category}`} className="btn-ghost text-sm">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 stagger sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <div className="mt-16 reveal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-surface-900">Customer Reviews ({reviews.length})</h2>
          {isAuthenticated && (
            <button onClick={() => setShowReviewForm(!showReviewForm)} className="btn-secondary text-sm">
              Write a Review
            </button>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
            <div className="card p-6 flex flex-col items-center justify-center">
              <p className="text-5xl font-display font-bold text-surface-900">{avgRating}</p>
              <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}`} />
                ))}
              </div>
              <p className="mt-2 text-xs text-surface-500">{reviews.length} reviews</p>
            </div>
            <div className="md:col-span-2 card p-6 space-y-2">
              {ratingDist.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-8 flex items-center gap-1 font-medium text-surface-700">{star}<Star className="h-3 w-3 fill-amber-400 text-amber-400" /></span>
                  <div className="flex-1 h-2 rounded-full bg-surface-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-surface-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="card p-6 mb-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium text-surface-700">Rating:</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button type="button" key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                    <Star className={`h-5 w-5 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}`} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="input-field min-h-[80px] text-sm"
              placeholder="Share your experience with this product..."
              required
            />
            {reviewError && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{reviewError}</p>
            )}
            <div className="mt-3 flex gap-3">
              <button type="submit" disabled={submittingReview} className="btn-primary text-sm">
                <Send className="h-4 w-4" /> {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-4 stagger">
            {reviews.map((review) => (
              <div key={review.id} className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xs font-bold">
                      {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 inline-flex items-center gap-1.5">
                        {review.userName || 'Anonymous'}
                        {review.verifiedPurchase && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <BadgeCheck className="h-3 w-3" /> Verified Purchase
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-surface-400">{review.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-surface-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 anim-rise">
            <p className="text-surface-500">No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
}