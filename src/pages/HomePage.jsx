import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Truck,
  Headphones,
  Star,
  TrendingUp,
  Store,
  Award,
  Users,
  Heart,
  CheckCircle,
  MessageCircle,
  Lock,
  RotateCcw,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getAllProducts, getAllCategories } from '../config/firestore';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const fallbackProducts = [
  {
    id: 'fallback-1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    originalPrice: 399.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 324,
    vendorName: 'AudioTech Pro',
    badge: 'Best Seller',
  },
  {
    id: 'fallback-2',
    name: 'Minimalist Leather Watch',
    price: 189.00,
    originalPrice: 249.00,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 187,
    vendorName: 'Timeless Co.',
    badge: 'Trending',
  },
  {
    id: 'fallback-3',
    name: 'Organic Cotton Hoodie',
    price: 79.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    rating: 4.7,
    reviewCount: 456,
    vendorName: 'EcoWear',
    badge: 'Eco-Friendly',
  },
  {
    id: 'fallback-4',
    name: 'Smart Home Hub',
    price: 149.99,
    originalPrice: 199.99,
    image: 'https://images.unsplash.com/photo-1558002038-1055e27e3c84?w=400&h=400&fit=crop',
    rating: 4.6,
    reviewCount: 203,
    vendorName: 'SmartLiving',
    badge: 'New Arrival',
  },
  {
    id: 'fallback-5',
    name: 'Professional Camera Lens',
    price: 899.00,
    originalPrice: 1199.00,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 89,
    vendorName: 'ProOptics',
    badge: 'Premium',
  },
  {
    id: 'fallback-6',
    name: 'Ergonomic Office Chair',
    price: 449.99,
    originalPrice: 599.99,
    image: 'https://images.unsplash.com/photo-1589384077800-1c1a1e3b6e4f?w=400&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 156,
    vendorName: 'WorkSpace Pro',
    badge: 'Top Rated',
  },
  {
    id: 'fallback-7',
    name: 'Artisan Coffee Set',
    price: 129.99,
    originalPrice: 159.99,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
    rating: 4.7,
    reviewCount: 278,
    vendorName: 'BrewMasters',
    badge: 'Gift Ready',
  },
  {
    id: 'fallback-8',
    name: 'Yoga Mat Premium',
    price: 69.99,
    originalPrice: 89.99,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 512,
    vendorName: 'ZenFlow',
    badge: 'Popular',
  },
];

const fallbackVendors = [
  {
    id: 'vendor-1',
    name: 'TechSphere Electronics',
    logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100&h=100&fit=crop',
    rating: 4.9,
    reviewCount: 2847,
    category: 'Electronics',
    verified: true,
    productsCount: 156,
    badge: 'Top Seller',
  },
  {
    id: 'vendor-2',
    name: 'Fashion Forward',
    logo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=100&h=100&fit=crop',
    rating: 4.8,
    reviewCount: 1923,
    category: 'Fashion',
    verified: true,
    productsCount: 234,
    badge: 'Trending',
  },
  {
    id: 'vendor-3',
    name: 'Home Essentials Co.',
    logo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop',
    rating: 4.9,
    reviewCount: 3156,
    category: 'Home & Living',
    verified: true,
    productsCount: 189,
    badge: 'Verified',
  },
  {
    id: 'vendor-4',
    name: 'FitLife Sports',
    logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop',
    rating: 4.7,
    reviewCount: 1456,
    category: 'Sports',
    verified: true,
    productsCount: 98,
    badge: 'Active',
  },
  {
    id: 'vendor-5',
    name: 'Pure Beauty',
    logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop',
    rating: 4.8,
    reviewCount: 2134,
    category: 'Beauty',
    verified: true,
    productsCount: 167,
    badge: 'New',
  },
  {
    id: 'vendor-6',
    name: 'BookWorm Paradise',
    logo: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop',
    rating: 4.9,
    reviewCount: 4567,
    category: 'Books',
    verified: true,
    productsCount: 523,
    badge: 'Largest Collection',
  },
];

const testimonials = [
  {
    id: 'test-1',
    name: 'Sarah Mitchell',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
    rating: 5,
    text: 'NexusMart has completely transformed how I shop online. The curated selection from verified vendors means I never have to worry about quality. Found my favorite leather jacket from Fashion Forward - arrived in 2 days!',
    location: 'San Francisco, CA',
    verified: true,
  },
  {
    id: 'test-2',
    name: 'James Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
    rating: 5,
    text: 'As a vendor, the platform tools are incredible. Analytics dashboard, inventory management, and the seller support team is actually helpful. My sales tripled in the first quarter after joining NexusMart.',
    location: 'Austin, TX',
    verified: true,
  },
  {
    id: 'test-3',
    name: 'Maria Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop',
    rating: 5,
    text: 'Love the eco-friendly filter! Finally a marketplace that lets me shop sustainably. The carbon-neutral shipping option and verified eco-certifications on products make it easy to make responsible choices.',
    location: 'Portland, OR',
    verified: true,
  },
  {
    id: 'test-4',
    name: 'David Park',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
    rating: 5,
    text: 'The buyer protection is real. Had an issue with a damaged item and the resolution process was seamless - full refund within 24 hours. This level of customer care is rare in e-commerce.',
    location: 'Seattle, WA',
    verified: true,
  },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
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
  const displayProducts = products.length > 0 ? products : fallbackProducts;
  const currentTestimonialData = testimonials[currentTestimonial];

  return (
    <div className="animate-fade-in">
      {/* Promotional Top Bar */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-accent">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 h-full w-1 bg-white/10 animate-pulse" />
          <div className="absolute top-0 right-1/4 h-full w-1 bg-white/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-primary-100">
              <Sparkles className="h-4 w-4 animate-bounce" />
              <span className="font-medium">Summer Sale Live!</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">Up to 60% Off</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">Free Shipping $50+</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">Code: SUMMER24</span>
            </div>
            <div className="flex items-center gap-4 text-primary-200">
              <span className="hidden xs:inline">Ends in:</span>
              <div className="flex items-center gap-1 font-mono font-semibold">
                <span className="px-2 py-0.5 rounded bg-white/10">12</span>
                <span className="text-primary-300">:</span>
                <span className="px-2 py-0.5 rounded bg-white/10">34</span>
                <span className="text-primary-300">:</span>
                <span className="px-2 py-0.5 rounded bg-white/10">56</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Trust Bar / Trust Badges */}
      <section className="border-b border-surface-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { icon: Lock, label: 'Secure Payments', desc: 'SSL encrypted checkout' },
              { icon: Shield, label: 'Verified Sellers', desc: 'Background checked vendors' },
              { icon: RotateCcw, label: 'Easy Returns', desc: '30-day hassle-free returns' },
              { icon: BadgeCheck, label: 'Quality Guarantee', desc: 'Authenticity verified' },
              { icon: Truck, label: 'Fast Delivery', desc: '2-5 business days' },
              { icon: Headphones, label: '24/7 Support', desc: 'Dedicated help center' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-100 group-hover:scale-105 transition-all duration-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">{label}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{desc}</p>
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
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon || '📦'}</span>
              <span className="text-sm font-semibold text-surface-700 group-hover:text-primary-600 transition-colors">{cat.name}</span>
              <span className="text-xs text-surface-400">{cat.count || 0} items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured / Trending Products */}
      <section className="bg-surface-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Trending Now</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-surface-900">Featured Products</h2>
              <p className="mt-1 text-sm text-surface-500">Hand-picked from top-rated vendors</p>
            </div>
            <Link to="/products" className="btn-ghost text-sm">
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.slice(0, 8).map((product) => (
              <article
                key={product.id}
                className="group card overflow-hidden bg-white transition-all duration-300 hover:shadow-premium hover:-translate-y-1 border border-surface-100 hover:border-primary-100"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {product.badge && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white">
                        {product.badge}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-surface-600 hover:bg-white hover:text-primary-600 transition-all shadow-soft group-hover:opacity-100 opacity-0">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs font-medium text-primary-600">{product.vendorName}</p>
                  <h3 className="font-semibold text-surface-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    <Link to={`/products/${product.id}`}>{product.name}</Link>
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-surface-700">{product.rating?.toFixed(1) || '4.8'}</span>
                      <span className="text-xs text-surface-400">({product.reviewCount || '100+'})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-surface-100">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-surface-900">${Number(product.price).toFixed(2)}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm line-through text-surface-400">${Number(product.originalPrice).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {loading && products.length === 0 && (
            <div className="mt-8 text-center">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </div>
      </section>

      {/* Top Stores / Verified Vendors */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Top Stores</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-surface-900">Verified Vendors</h2>
            <p className="mt-1 text-sm text-surface-500">Trusted sellers with exceptional ratings and service</p>
          </div>
          <Link to="/vendors" className="btn-ghost text-sm">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {fallbackVendors.map((vendor) => (
            <Link
              key={vendor.id}
              to={`/vendor/${vendor.id}`}
              className="group card bg-white border border-surface-100 hover:border-primary-200 hover:shadow-premium transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-5">
                <div className="relative mb-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-accent/20 mx-auto">
                    <img
                      src={vendor.logo}
                      alt={vendor.name}
                      className="h-14 w-14 rounded-xl object-cover"
                      loading="lazy"
                    />
                  </div>
                  {vendor.badge && (
                    <div className="absolute -top-1 right-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {vendor.badge}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                    {vendor.name}
                  </h3>
                  <p className="mt-1 text-xs text-surface-500 capitalize">{vendor.category}</p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-surface-700">{vendor.rating}</span>
                      <span className="text-xs text-surface-400">({vendor.reviewCount.toLocaleString()})</span>
                    </div>
                    {vendor.verified && (
                      <BadgeCheck className="h-4 w-4 text-primary-600" title="Verified Vendor" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-surface-500">
                    {vendor.productsCount} products
                  </p>
                </div>
              </div>
              <div className="bg-surface-50 border-t border-surface-100 px-5 py-3">
                <span className="w-full rounded-full bg-primary-100 px-3 py-1.5 text-center text-xs font-medium text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  Visit Store
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="bg-surface-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-2">
              <MessageCircle className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Social Proof</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-surface-900">What Our Customers Say</h2>
            <p className="mt-2 text-sm text-surface-500 max-w-2xl mx-auto">Real experiences from our community of buyers and sellers</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                    <article className="card bg-white max-w-xl mx-auto">
                      <div className="p-8">
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < testimonial.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-surface-200'
                              }`}
                            />
                          ))}
                        </div>
                        <blockquote className="text-base text-surface-700 leading-relaxed mb-6">
                          &ldquo;{testimonial.text}&rdquo;
                        </blockquote>
                        <div className="flex items-center gap-4">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="h-12 w-12 rounded-full ring-2 ring-primary-100"
                          />
                          <div>
                            <p className="font-semibold text-surface-900">{testimonial.name}</p>
                            <p className="text-xs text-surface-500">{testimonial.location}</p>
                          </div>
                          {testimonial.verified && (
                            <div className="ml-auto flex items-center gap-1 text-primary-600">
                              <BadgeCheck className="h-4 w-4" />
                              <span className="text-xs font-medium">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-primary-600 w-8'
                      : 'bg-surface-300 hover:bg-surface-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            {/* Prev/Next Buttons */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none -mx-4">
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-surface-600 hover:bg-white hover:text-primary-600 shadow-soft transition-all"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-surface-600 hover:bg-white hover:text-primary-600 shadow-soft transition-all"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: '500K+', label: 'Happy Customers' },
              { icon: Store, value: '10K+', label: 'Verified Vendors' },
              { icon: Award, value: '1M+', label: 'Products Listed' },
              { icon: Heart, value: '4.9/5', label: 'Average Rating' },
            ].map((stat, index) => (
              <div key={index} className="text-center p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 mx-auto mb-3">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-2xl font-display font-bold text-surface-900">{stat.value}</p>
                <p className="text-sm text-surface-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-accent p-12 lg:p-16">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-[80px]" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-display font-bold text-white">Start Selling on NexusMart</h2>
            <p className="mt-4 text-lg text-primary-100/80">
              Join thousands of vendors and reach millions of customers. Set up your store in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-primary-700 shadow-xl transition-all hover:shadow-2xl active:scale-[0.98]">
                Become a Vendor
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/vendor" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-transparent px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="border-t border-surface-100 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Stay Updated</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-surface-900">Subscribe to Our Newsletter</h2>
          <p className="mt-2 text-sm text-surface-500">Get exclusive deals, new arrivals, and vendor stories delivered to your inbox.</p>
          <form className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <label className="sr-only">Email address</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 input-field text-center sm:text-left"
              required
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              Subscribe
            </button>
          </form>
          <p className="mt-3 text-xs text-surface-400">No spam, unsubscribe anytime. By subscribing, you agree to our <Link to="/privacy" className="underline hover:text-primary-600">Privacy Policy</Link>.</p>
        </div>
      </section>
    </div>
  );
}