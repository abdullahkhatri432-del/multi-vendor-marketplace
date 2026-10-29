import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getWishlist, removeFromWishlist, getProduct } from '../config/firestore';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function WishlistPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const productIds = await getWishlist(user.uid);
        const products = await Promise.all(productIds.map((id) => getProduct(id)));
        setWishlistProducts(products.filter(Boolean));
      } catch (err) {
        console.error('Failed to fetch wishlist:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchWishlist();
  }, [user]);

  const handleRemove = async (productId) => {
    await removeFromWishlist(user.uid, productId);
    setWishlistProducts(wishlistProducts.filter((p) => p.id !== productId));
  };

  if (authLoading) return <LoadingSpinner size="lg" className="py-32" />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 reveal">
        <h1 className="text-3xl font-display font-bold text-surface-900">My Wishlist</h1>
        <p className="mt-1 text-surface-500">{wishlistProducts.length} items saved</p>
      </div>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger">
          {wishlistProducts.map((product) => (
            <div key={product.id} className="card overflow-hidden shine-sweep flex h-full flex-col">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-100">
                <img src={product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/400/400`} alt={product.name} className="h-full w-full object-cover" />
                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <Link to={`/products/${product.id}`} className="block min-w-0">
                  <p className="line-clamp-2 min-h-[2.75em] text-sm font-semibold text-surface-900 hover:text-primary-600 transition-colors">{product.name}</p>
                </Link>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-surface-200/60 pt-3">
                  <span className="whitespace-nowrap text-lg font-bold text-surface-900">
                    ₹{Number(product.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => addItem(product)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all"
                    aria-label="Add to cart"
                    title="Add to cart"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="anim-rise">
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Save products you love by clicking the heart icon on any product."
            action={() => {}}
            actionLabel="Browse Products"
          />
        </div>
      )}
    </div>
  );
}
