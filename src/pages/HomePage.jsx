import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Truck, Headphones, Star, TrendingUp } from 'lucide-react';
import { getAllProducts, getAllCategories } from '../config/firestore';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cats] = await Promise.all([
          getAllProducts(8),
          getAllCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const defaultCategories = [
    { id: 'electronics', name: 'Electronics', icon: '💻', count: 234 },
    { id: 'fashion', name: 'Fashion', icon: '👗', count: 189 },
    { id: 'home', name: 'Home & Living', icon: '🏠', count: 156 },
    { id: 'sports', name: 'Sports', icon: '⚽', count: 98 },
    { id: 'beauty', name: 'Beauty', icon: '✨', count: 145 },
    { id: 'books', name: 'Books', icon: '📚', count: 312 },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-accent">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-primary-500 blur-[120px]" />
          <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-accent blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-primary-200 backdrop-blur-sm border border-white/10 mb-6">
              <Sparkles className="h-4 w-4" />
              The Future of Multi-Vendor Commerce
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight">
              Discover Premium Products from{' '}
              <span className="bg-gradient-to-r from-primary-300 to-accent-light bg-clip-text text-transparent">
                Verified Vendors
              </span>
            </h1>
            <p className="mt-6 text-lg text-primary-200/80 max-w-2xl leading-relaxed">
              Shop from thousands of trusted sellers. Curated collections, seamless checkout, and a marketplace built for the modern era.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-primary-900 shadow-xl transition-all hover:bg-primary-50 hover:shadow-2xl active:scale-[0.98]">
                Explore Marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10">
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-surface-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'Verified Sellers', value: '100+' },
              { icon: Truck, label: 'Fast Delivery', value: '2-5 Days' },
              { icon: Headphones, label: '24/7 Support', value: 'Always On' },
              { icon: Star, label: 'Customer Rating', value: '4.9/5' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{value}</p>
                  <p className="text-xs text-surface-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-surface-900">Shop by Category</h2>
            <p className="mt-1 text-sm text-surface-500">Browse our curated collections</p>
          </div>
          <Link to="/products" className="btn-ghost text-sm">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-surface-100 bg-white p-6 text-center shadow-soft transition-all hover:border-primary-200 hover:shadow-premium hover:-translate-y-1"
            >
              <span className="text-3xl">{cat.icon || '📦'}</span>
              <span className="text-sm font-semibold text-surface-700 group-hover:text-primary-600 transition-colors">{cat.name}</span>
              <span className="text-xs text-surface-400">{cat.count || 0} items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-surface-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Trending Now</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-surface-900">Featured Products</h2>
            </div>
            <Link to="/products" className="btn-ghost text-sm">
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="aspect-square skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-1/3 skeleton rounded" />
                    <div className="h-4 w-3/4 skeleton rounded" />
                    <div className="h-4 w-1/2 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-surface-500">No products yet. Be the first to list!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-accent p-12 lg:p-16">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-display font-bold text-white">Start Selling on NexusMart</h2>
            <p className="mt-4 text-lg text-primary-100/80">
              Join thousands of vendors and reach millions of customers. Set up your store in minutes.
            </p>
            <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-primary-700 shadow-xl transition-all hover:shadow-2xl active:scale-[0.98]">
              Become a Vendor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
