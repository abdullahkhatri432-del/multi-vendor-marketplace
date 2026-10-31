import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { getProduct } from '../config/firestore';
import ProductCard from '../components/ui/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

import usePageMeta from '../hooks/usePageMeta';
export default function WishlistPage() {
  usePageMeta({
    title: 'My wishlist — Speedersmania',
    description: 'Products you have saved for later.',
    path: '/wishlist',
    robots: 'noindex, nofollow',
  });
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { wishlistIds, loading: wishlistLoading } = useWishlist();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stable key so the effect re-runs only when the saved set actually changes.
  const idsKey = useMemo(() => wishlistIds.join(','), [wishlistIds]);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return undefined;
    }
    if (wishlistLoading) return undefined;
    if (wishlistIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    Promise.all(wishlistIds.map((id) => getProduct(id).catch(() => null)))
      .then((items) => {
        if (!cancelled) setProducts(items.filter(Boolean));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, wishlistLoading, idsKey]);

  // Keep the grid in lockstep with optimistic removals from the shared store.
  const visibleProducts = useMemo(
    () => products.filter((product) => wishlistIds.includes(product.id)),
    [products, wishlistIds],
  );

  if (authLoading || wishlistLoading) return <LoadingSpinner size="lg" className="py-32" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 reveal">
        <h1 className="text-3xl font-display font-bold text-surface-900">My Wishlist</h1>
        <p className="mt-1 text-surface-500">
          {visibleProducts.length} {visibleProducts.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 stagger sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="anim-rise">
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Save products you love by clicking the heart icon on any product."
            action={() => navigate('/products')}
            actionLabel="Browse Products"
          />
        </div>
      )}

      <p className="mt-10 text-center text-xs text-ink-muted">
        Tip: tap the heart on a saved product to remove it.{' '}
        <Link to="/products" className="link-underline text-primary-600">
          Keep browsing
        </Link>
      </p>
    </div>
  );
}
