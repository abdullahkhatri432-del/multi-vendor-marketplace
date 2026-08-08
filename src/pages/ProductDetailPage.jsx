import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Truck, Shield, RotateCcw, Heart, ArrowLeft, Minus, Plus, Store, Send } from 'lucide-react';
import { getProduct, getVendor, getReviewsByProduct, createReview, getWishlist, addToWishlist, removeFromWishlist } from '../config/firestore';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prod = await getProduct(id);
        if (prod) {
          setProduct(prod);
          if (prod.vendorId) {
            const vend = await getVendor(prod.vendorId);
            setVendor(vend);
          }
        }
        const revs = await getReviewsByProduct(id);
        setReviews(revs);
        if (user) {
          const wishlist = await getWishlist(user.uid);
          setIsInWishlist(wishlist.includes(id));
        }
      } catch (err) { console.error('Failed to fetch product:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, user]);

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    addItem(product, quantity, selectedAddons);
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
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isInWishlist) {
      await removeFromWishlist(user.uid, id);
      setIsInWishlist(false);
    } else {
      await addToWishlist(user.uid, id);
      setIsInWishlist(true);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!reviewForm.comment.trim()) return;

    setSubmittingReview(true);
    try {
      await createReview(id, {
        userId: user.uid,
        userName: user.displayName,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      const revs = await getReviewsByProduct(id);
      setReviews(revs);
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
    } catch (err) { console.error('Failed to submit review:', err); }
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

  const images = product.images?.length > 0 ? product.images : [product.image || `https://picsum.photos/seed/${product.id}/600/600`];
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : (product.rating?.toFixed(1) || '4.5');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-6"><ArrowLeft className="h-4 w-4" /> Back</button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-3xl bg-surface-100">
            <img src={images[selectedImage]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition-all ${i === selectedImage ? 'border-primary-500 shadow-glow' : 'border-surface-200'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge-primary">{product.category || 'General'}</span>
            {product.discount > 0 && <span className="badge-danger">-{product.discount}% OFF</span>}
          </div>

          <h1 className="text-3xl font-display font-bold text-surface-900 leading-tight">{product.name}</h1>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}`} />
              ))}
            </div>
            <span className="text-sm text-surface-500">{avgRating} ({reviews.length} reviews)</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-surface-900">${product.price?.toFixed(2)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-surface-400 line-through">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>

          <p className="mt-6 text-surface-600 leading-relaxed">{product.description}</p>

          {/* Add-ons Section */}
          {product.addons && product.addons.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Available Add-ons</h3>
              <div className="space-y-3">
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
                      <span className="text-sm font-semibold text-primary-600">₹{addon.price?.toFixed(2)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-surface-500">Base Price:</span>
              <span className="text-lg font-bold text-surface-900">${product.price?.toFixed(2)}</span>
            </div>
            {selectedAddons.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-surface-500">Add-ons:</span>
                <span className="text-lg font-bold text-primary-600">
                  +${selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-surface-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-surface-600">Total for {quantity}×:</span>
                <span className="text-2xl font-bold text-surface-900">
                  ${((product.price || 0) * quantity + selectedAddons.reduce((sum, addon) => sum + (addon.price || 0) * quantity, 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {vendor && (
            <Link to={`/products?vendor=${product.vendorId}`} className="mt-6 flex items-center gap-3 rounded-2xl border border-surface-100 p-4 hover:border-primary-200 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50"><Store className="h-6 w-6 text-primary-600" /></div>
              <div>
                <p className="text-sm font-semibold text-surface-900">{vendor.storeName}</p>
                <p className="text-xs text-surface-500">{vendor.totalSales || 0} sales</p>
              </div>
            </Link>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-surface-200 bg-white">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-11 w-11 items-center justify-center text-surface-500 hover:text-surface-900"><Minus className="h-4 w-4" /></button>
              <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="flex h-11 w-11 items-center justify-center text-surface-500 hover:text-surface-900"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={handleAddToCart} className="btn-primary flex-1"><ShoppingCart className="h-5 w-5" /> Add to Cart</button>
            <button onClick={handleToggleWishlist} className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${isInWishlist ? 'border-red-200 bg-red-50 text-red-500' : 'border-surface-200 text-surface-400 hover:text-red-500 hover:border-red-200'}`}>
              <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[{ icon: Truck, label: 'Free Shipping' }, { icon: Shield, label: 'Secure Payment' }, { icon: RotateCcw, label: 'Easy Returns' }].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-surface-50 p-4 text-center">
                <Icon className="h-5 w-5 text-primary-600" />
                <span className="text-xs font-medium text-surface-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-surface-900">Customer Reviews ({reviews.length})</h2>
          {isAuthenticated && (
            <button onClick={() => setShowReviewForm(!showReviewForm)} className="btn-secondary text-sm">
              Write a Review
            </button>
          )}
        </div>

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
            <div className="mt-3 flex gap-3">
              <button type="submit" disabled={submittingReview} className="btn-primary text-sm">
                <Send className="h-4 w-4" /> {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="card p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xs font-bold">
                      {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{review.userName || 'Anonymous'}</p>
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
          <div className="text-center py-12">
            <p className="text-surface-500">No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
}
