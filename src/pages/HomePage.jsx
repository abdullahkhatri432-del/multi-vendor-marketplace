import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
<<<<<<< Updated upstream
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
  MessageCircle,
  Lock,
  RotateCcw,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Shirt,
  Home,
  Dumbbell,
  Sparkle,
  BookOpen,
  Zap,
  Clock,
} from 'lucide-react';
import { getAllProducts, getAllCategories } from '../config/firestore';
import { fallbackProducts, fallbackVendors } from '../config/fallbackData';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

=======
  ArrowRight, Sparkles, Shield, Truck, Headphones, Star, TrendingUp,
  Store, Award, Users, Heart, CheckCircle, MessageCircle, Lock,
  RotateCcw, BadgeCheck, ChevronLeft, ChevronRight, Zap, Gift,
  ShoppingBag, ArrowUpRight, Flame, Clock, Percent,
} from 'lucide-react';
import { getAllProducts, getAllCategories, getVerifiedVendors } from '../config/firestore';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const fallbackProducts = [
  { id: 'fallback-1', name: 'Premium Wireless Headphones', price: 299.99, originalPrice: 399.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', rating: 4.8, reviewCount: 324, vendorName: 'AudioTech Pro', badge: 'Best Seller' },
  { id: 'fallback-2', name: 'Minimalist Leather Watch', price: 189.00, originalPrice: 249.00, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop', rating: 4.9, reviewCount: 187, vendorName: 'Timeless Co.', badge: 'Trending' },
  { id: 'fallback-3', name: 'Organic Cotton Hoodie', price: 79.99, originalPrice: 99.99, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', rating: 4.7, reviewCount: 456, vendorName: 'EcoWear', badge: 'Eco-Friendly' },
  { id: 'fallback-4', name: 'Smart Home Hub', price: 149.99, originalPrice: 199.99, image: 'https://images.unsplash.com/photo-1558002038-1055e27e3c84?w=400&h=400&fit=crop', rating: 4.6, reviewCount: 203, vendorName: 'SmartLiving', badge: 'New Arrival' },
  { id: 'fallback-5', name: 'Professional Camera Lens', price: 899.00, originalPrice: 1199.00, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop', rating: 4.9, reviewCount: 89, vendorName: 'ProOptics', badge: 'Premium' },
  { id: 'fallback-6', name: 'Ergonomic Office Chair', price: 449.99, originalPrice: 599.99, image: 'https://images.unsplash.com/photo-1589384077800-1c1a1e3b6e4f?w=400&h=400&fit=crop', rating: 4.8, reviewCount: 156, vendorName: 'WorkSpace Pro', badge: 'Top Rated' },
  { id: 'fallback-7', name: 'Artisan Coffee Set', price: 129.99, originalPrice: 159.99, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', rating: 4.7, reviewCount: 278, vendorName: 'BrewMasters', badge: 'Gift Ready' },
  { id: 'fallback-8', name: 'Yoga Mat Premium', price: 69.99, originalPrice: 89.99, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop', rating: 4.8, reviewCount: 512, vendorName: 'ZenFlow', badge: 'Popular' },
];

const fallbackVendors = [
  { id: 'vendor-1', name: 'TechSphere Electronics', logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100&h=100&fit=crop', rating: 4.9, reviewCount: 2847, category: 'Electronics', verified: true, productsCount: 156, badge: 'Top Seller' },
  { id: 'vendor-2', name: 'Fashion Forward', logo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=100&h=100&fit=crop', rating: 4.8, reviewCount: 1923, category: 'Fashion', verified: true, productsCount: 234, badge: 'Trending' },
  { id: 'vendor-3', name: 'Home Essentials Co.', logo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop', rating: 4.9, reviewCount: 3156, category: 'Home & Living', verified: true, productsCount: 189, badge: 'Verified' },
  { id: 'vendor-4', name: 'FitLife Sports', logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop', rating: 4.7, reviewCount: 1456, category: 'Sports', verified: true, productsCount: 98, badge: 'Active' },
  { id: 'vendor-5', name: 'Pure Beauty', logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop', rating: 4.8, reviewCount: 2134, category: 'Beauty', verified: true, productsCount: 167, badge: 'New' },
  { id: 'vendor-6', name: 'BookWorm Paradise', logo: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop', rating: 4.9, reviewCount: 4567, category: 'Books', verified: true, productsCount: 523, badge: 'Largest Collection' },
];

>>>>>>> Stashed changes
const testimonials = [
  { id: 'test-1', name: 'Sarah Mitchell', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop', rating: 5, text: 'Speedersmania has completely transformed how I shop online. The curated selection from verified vendors means I never have to worry about quality.', location: 'San Francisco, CA' },
  { id: 'test-2', name: 'James Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop', rating: 5, text: 'As a vendor, the platform tools are incredible. Analytics dashboard, inventory management, and the seller support team is actually helpful.', location: 'Austin, TX' },
  { id: 'test-3', name: 'Maria Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop', rating: 5, text: 'Love the eco-friendly filter! Finally a marketplace that lets me shop sustainably. The carbon-neutral shipping option is amazing.', location: 'Portland, OR' },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 32, secs: 8 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cats, vend] = await Promise.all([
          getAllProducts(8),
          getAllCategories(),
          getVerifiedVendors(),
        ]);
        setProducts(prods);
        setCategories(cats);
        setVendors(vend);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Live countdown for the promo bar (resets to 3 days on expiry)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, mins, secs } = prev;
        secs -= 1;
        if (secs < 0) { secs = 59; mins -= 1; }
        if (mins < 0) { mins = 59; hours -= 1; }
        if (hours < 0) { hours = 23; days -= 1; }
        if (days < 0) return { days: 3, hours: 0, mins: 0, secs: 0 };
        return { days, hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const categoryIcons = {
    electronics: Cpu,
    fashion: Shirt,
    home: Home,
    sports: Dumbbell,
    beauty: Sparkle,
    books: BookOpen,
  };

  const defaultCategories = [
    { id: 'electronics', name: 'Electronics', count: 234 },
    { id: 'fashion', name: 'Fashion', count: 189 },
    { id: 'home', name: 'Home & Living', count: 156 },
    { id: 'sports', name: 'Sports', count: 98 },
    { id: 'beauty', name: 'Beauty', count: 145 },
    { id: 'books', name: 'Books', count: 312 },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;
  const displayProducts = products.length > 0 ? products : fallbackProducts;
  const displayVendors = vendors.length > 0
    ? vendors.map((v) => ({ id: v.id, name: v.storeName || 'My Store', logo: v.logo || `https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100&h=100&fit=crop`, rating: v.rating || 0, reviewCount: 0, category: 'Verified Store', verified: v.verified !== false, productsCount: v.totalProducts || 0, badge: v.verified ? 'Verified' : '' }))
    : fallbackVendors;

  return (
    <div className="animate-fade-in">
      {/* Promo Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-500 to-accent">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 h-full w-px bg-white/20 animate-pulse" />
          <div className="absolute top-0 right-1/3 h-full w-px bg-white/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
<<<<<<< Updated upstream
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-primary-100 flex-wrap justify-center">
              <Sparkles className="h-4 w-4 animate-bounce" />
              <span className="font-medium">Summer Sale Live!</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">Up to 60% Off</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">Free Shipping ₹999+</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">Code: SUMMER24</span>
            </div>
            <div className="flex items-center gap-2 text-primary-200">
              <Clock className="h-4 w-4" />
              <span className="hidden xs:inline text-xs">Ends in:</span>
              <div className="flex items-center gap-1 font-mono font-semibold tabular-nums">
                <span className="px-2 py-0.5 rounded bg-white/10">{pad(timeLeft.days)}d</span>
                <span className="text-primary-300">:</span>
                <span className="px-2 py-0.5 rounded bg-white/10">{pad(timeLeft.hours)}</span>
                <span className="text-primary-300">:</span>
                <span className="px-2 py-0.5 rounded bg-white/10">{pad(timeLeft.mins)}</span>
                <span className="text-primary-300">:</span>
                <span className="px-2 py-0.5 rounded bg-white/10">{pad(timeLeft.secs)}</span>
              </div>
=======
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-2 text-white">
              <Flame className="h-4 w-4 animate-bounce" />
              <span className="font-semibold">Summer Sale Live!</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">Up to 60% Off</span>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">Free Shipping ₹999+</span>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">Code: SUMMER20</span>
>>>>>>> Stashed changes
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-accent">
<<<<<<< Updated upstream
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-primary-500/50 blur-[120px] animate-blob" />
          <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-accent/50 blur-[150px] animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-400/30 blur-[120px] animate-blob animation-delay-4000" />
=======
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-primary-500/20 blur-[120px] animate-float" />
          <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-accent/20 blur-[150px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary-600/10 blur-[200px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 grid-pattern opacity-30" />
>>>>>>> Stashed changes
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
<<<<<<< Updated upstream
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-primary-200 backdrop-blur-sm border border-white/10 mb-6 animate-float">
=======
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 text-sm font-medium text-primary-200 mb-6 animate-fade-in">
>>>>>>> Stashed changes
              <Sparkles className="h-4 w-4" />
              The Future of Multi-Vendor Commerce
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight animate-slide-up">
              Discover Premium Products from{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary-300 via-accent-light to-primary-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                  Verified Vendors
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8C40 2 80 2 100 6C120 10 160 10 198 4" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="200" y2="0">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            <p className="mt-6 text-lg text-primary-200/80 max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Shop from thousands of trusted sellers. Curated collections, seamless checkout, and a marketplace built for the modern era.
            </p>
<<<<<<< Updated upstream
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-primary-900 shadow-xl transition-all hover:bg-primary-50 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98]">
=======
            <div className="mt-8 flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/products" className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-primary-900 shadow-xl transition-all duration-300 hover:bg-primary-50 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]">
>>>>>>> Stashed changes
                Explore Marketplace
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
<<<<<<< Updated upstream
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5">
=======
              <Link to="/register" className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/30">
>>>>>>> Stashed changes
                Start Selling
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
              {[
                { icon: Shield, label: 'Buyer Protection' },
                { icon: Zap, label: '2-Day Delivery' },
                { icon: RotateCcw, label: '30-Day Returns' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-primary-200/80">
                  <Icon className="h-4 w-4 text-primary-300" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-surface-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Lock, label: 'Secure Payments', desc: 'SSL encrypted' },
              { icon: Shield, label: 'Verified Sellers', desc: 'Background checked' },
              { icon: RotateCcw, label: 'Easy Returns', desc: '30-day policy' },
              { icon: BadgeCheck, label: 'Quality Guarantee', desc: 'Authenticity verified' },
              { icon: Truck, label: 'Fast Delivery', desc: '2-5 business days' },
<<<<<<< Updated upstream
              { icon: Headphones, label: '24/7 Support', desc: 'Dedicated help center' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 group cursor-default">
                <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-glow group-hover:scale-105 transition-all duration-300">
                  <Icon className="h-5 w-5" />
=======
              { icon: Headphones, label: '24/7 Support', desc: 'Dedicated help' },
            ].map(({ icon: Icon, label, desc }, index) => (
              <div key={label} className="flex items-start gap-3 group" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-100 group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-4.5 w-4.5" />
>>>>>>> Stashed changes
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">{label}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee brand strip */}
      <section className="border-b border-surface-100 bg-white py-5 overflow-hidden">
        <div className="relative flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-12 pr-12 whitespace-nowrap">
            {['AudioTech Pro', 'Timeless Co.', 'EcoWear', 'SmartLiving', 'ProOptics', 'WorkSpace Pro', 'BrewMasters', 'ZenFlow'].concat(['AudioTech Pro', 'Timeless Co.', 'EcoWear', 'SmartLiving', 'ProOptics', 'WorkSpace Pro', 'BrewMasters', 'ZenFlow']).map((name, i) => (
              <div key={i} className="flex items-center gap-2.5 text-surface-400">
                <Store className="h-4 w-4 text-primary-300" />
                <span className="text-sm font-semibold tracking-wide uppercase">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
<<<<<<< Updated upstream
        <div className="flex items-center justify-between mb-8 reveal">
=======
        <div className="flex items-end justify-between mb-8">
>>>>>>> Stashed changes
          <div>
            <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Browse</span>
            <h2 className="text-3xl font-display font-bold text-surface-900 mt-1">Shop by Category</h2>
          </div>
          <Link to="/products" className="group btn-ghost text-sm">
            View All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
<<<<<<< Updated upstream
          {displayCategories.map((cat) => {
            const Icon = categoryIcons[cat.id] || Store;
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-surface-100 bg-white p-6 text-center shadow-soft transition-all hover:border-primary-200 hover:shadow-premium hover:-translate-y-1"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-primary-600 group-hover:to-accent group-hover:text-white group-hover:shadow-glow">
                  <Icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
                </span>
                <span className="text-sm font-semibold text-surface-700 group-hover:text-primary-600 transition-colors">{cat.name}</span>
                <span className="text-xs text-surface-400">{cat.count || 0} items</span>
              </Link>
            );
          })}
=======
          {displayCategories.map((cat, index) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group relative flex flex-col items-center gap-3 rounded-3xl border border-surface-100 bg-white/80 backdrop-blur-sm p-6 text-center shadow-soft transition-all duration-300 hover:border-primary-200 hover:shadow-card-hover hover:-translate-y-1 overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative text-4xl group-hover:scale-125 transition-transform duration-300">{cat.icon || '📦'}</span>
              <div className="relative">
                <span className="text-sm font-semibold text-surface-700 group-hover:text-primary-600 transition-colors">{cat.name}</span>
                <span className="block text-xs text-surface-400 mt-0.5">{cat.count || 0} items</span>
              </div>
            </Link>
          ))}
>>>>>>> Stashed changes
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gradient-to-b from-surface-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<<<<<<< Updated upstream
          <div className="flex items-center justify-between mb-8 reveal">
=======
          <div className="flex items-end justify-between mb-10">
>>>>>>> Stashed changes
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Trending Now</span>
              </div>
              <h2 className="text-3xl font-display font-bold text-surface-900">Featured Products</h2>
              <p className="mt-2 text-surface-500">Hand-picked from top-rated vendors</p>
            </div>
            <Link to="/products" className="group btn-ghost text-sm">
              See All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
<<<<<<< Updated upstream
            {displayProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="reveal">
=======
            {displayProducts.slice(0, 8).map((product, index) => (
              <div key={product.id} style={{ animationDelay: `${index * 0.05}s` }}>
>>>>>>> Stashed changes
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {loading && products.length === 0 && (
            <div className="mt-8 text-center">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </div>
      </section>

<<<<<<< Updated upstream
      {/* Flash Deals banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-950 via-primary-900 to-primary-800 p-8 lg:p-12 shadow-premium">
          <div className="absolute inset-0 bg-dots opacity-30" />
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-accent/40 blur-[100px] animate-blob" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-primary-400/30 blur-[100px] animate-blob animation-delay-2000" />
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 border border-white/10 px-4 py-1.5 text-xs font-semibold text-accent-light backdrop-blur-sm mb-4">
                <Zap className="h-3.5 w-3.5" />
                Limited Time Offer
              </div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-white leading-tight">
                Flash Deals — up to 60% off
              </h2>
              <p className="mt-3 text-primary-200/80 leading-relaxed">
                Hand-picked deals from top vendors. Prices drop every hour — grab them before they're gone.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link to="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-primary-900 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.98]">
                  Shop Deals <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/products" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10">
                  Browse All
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white shrink-0">
              {[
                { value: pad(timeLeft.hours), label: 'Hours' },
                { value: pad(timeLeft.mins), label: 'Mins' },
                { value: pad(timeLeft.secs), label: 'Secs' },
              ].map((unit) => (
                <div key={unit.label} className="flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm font-display text-3xl font-bold tabular-nums shadow-inner-glow">
                    {unit.value}
                  </div>
                  <span className="mt-2 text-xs font-medium text-primary-200">{unit.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top Stores / Verified Vendors */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10 reveal">
=======
      {/* Top Vendors */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-10">
>>>>>>> Stashed changes
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Top Stores</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-surface-900">Verified Vendors</h2>
            <p className="mt-2 text-surface-500">Trusted sellers with exceptional ratings</p>
          </div>
<<<<<<< Updated upstream
          <Link to="/products" className="btn-ghost text-sm">
            View All <ArrowRight className="h-4 w-4" />
=======
          <Link to="/vendors" className="group btn-ghost text-sm">
            View All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
>>>>>>> Stashed changes
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {displayVendors.map((vendor, index) => (
            <Link
              key={vendor.id}
              to={`/vendor/${vendor.id}`}
              className="group relative card bg-white/80 backdrop-blur-sm border border-surface-100 hover:border-primary-200 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="p-5">
                <div className="relative mb-4">
<<<<<<< Updated upstream
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-accent/20 mx-auto transition-all duration-300 group-hover:from-primary-600 group-hover:to-accent">
                    <img
                      src={vendor.logo}
                      alt={vendor.name}
                      className="h-14 w-14 rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
=======
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-accent/20 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={vendor.logo}
                      alt={vendor.name}
                      className="h-12 w-12 rounded-xl object-cover"
>>>>>>> Stashed changes
                      loading="lazy"
                    />
                  </div>
                  {vendor.badge && (
                    <div className="absolute -top-1 -right-1">
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-primary-600 to-accent px-2 py-0.5 text-2xs font-bold text-white shadow-sm">
                        {vendor.badge}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors line-clamp-1 text-sm">
                    {vendor.name}
                  </h3>
                  <p className="mt-1 text-xs text-surface-400 capitalize">{vendor.category}</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold text-surface-700">{vendor.rating}</span>
                    {vendor.verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-primary-500" />
                    )}
                  </div>
                  <p className="mt-1 text-2xs text-surface-400">{vendor.productsCount} products</p>
                </div>
              </div>
<<<<<<< Updated upstream
              <div className="bg-surface-50 border-t border-surface-100 px-5 py-3">
                <span className="w-full rounded-full bg-primary-100 px-3 py-1.5 text-center text-xs font-medium text-primary-700 transition-colors duration-300 group-hover:bg-primary-600 group-hover:text-white">
=======
              <div className="bg-surface-50/80 border-t border-surface-100 px-5 py-2.5">
                <span className="w-full rounded-xl bg-primary-100/80 px-3 py-1.5 text-center text-xs font-medium text-primary-700 transition-all group-hover:bg-primary-600 group-hover:text-white inline-block">
>>>>>>> Stashed changes
                  Visit Store
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-b from-white to-surface-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <div className="inline-flex items-center gap-2 mb-2">
              <MessageCircle className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Social Proof</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-surface-900">What Our Customers Say</h2>
          </div>

<<<<<<< Updated upstream
          <div className="relative max-w-4xl mx-auto reveal">
            <div className="overflow-hidden">
=======
          <div className="relative max-w-3xl mx-auto">
            <div className="overflow-hidden rounded-3xl">
>>>>>>> Stashed changes
              <div
                className="flex transition-transform duration-500 ease-out-expo"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
<<<<<<< Updated upstream
                    <article className="card bg-white max-w-xl mx-auto hover:border-primary-100">
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
=======
                    <div className="card bg-white/80 backdrop-blur-sm p-8 sm:p-10 text-center">
                      <div className="flex items-center justify-center gap-1 mb-5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-5 w-5 ${i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}`} />
                        ))}
                      </div>
                      <blockquote className="text-lg text-surface-700 leading-relaxed mb-6">
                        &ldquo;{testimonial.text}&rdquo;
                      </blockquote>
                      <div className="flex items-center justify-center gap-4">
                        <img src={testimonial.avatar} alt={testimonial.name} className="h-12 w-12 rounded-full ring-4 ring-primary-100" />
                        <div className="text-left">
                          <p className="font-semibold text-surface-900">{testimonial.name}</p>
                          <p className="text-xs text-surface-500">{testimonial.location}</p>
>>>>>>> Stashed changes
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-primary-600 w-8' : 'bg-surface-200 hover:bg-surface-300 w-2'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

<<<<<<< Updated upstream
            {/* Prev/Next Buttons */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none -mx-4">
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-surface-600 hover:bg-white hover:text-primary-600 shadow-soft transition-all active:scale-95"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-surface-600 hover:bg-white hover:text-primary-600 shadow-soft transition-all active:scale-95"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
=======
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-surface-600 shadow-lg hover:bg-white hover:text-primary-600 transition-all hidden sm:flex"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-surface-600 shadow-lg hover:bg-white hover:text-primary-600 transition-all hidden sm:flex"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
>>>>>>> Stashed changes
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: '500K+', label: 'Happy Customers' },
              { icon: Store, value: '10K+', label: 'Verified Vendors' },
              { icon: Award, value: '1M+', label: 'Products Listed' },
              { icon: Heart, value: '4.9/5', label: 'Average Rating' },
<<<<<<< Updated upstream
            ].map((stat, index) => (
              <div key={index} className="text-center p-4 reveal">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-accent/10 text-primary-600 mx-auto mb-3 transition-transform duration-300 hover:scale-110 hover:shadow-glow">
                  <stat.icon className="h-6 w-6" />
=======
            ].map(({ icon: Icon, value, label }, index) => (
              <div key={label} className="text-center p-6 rounded-3xl bg-white/80 backdrop-blur-sm border border-surface-100 shadow-soft">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mx-auto mb-3">
                  <Icon className="h-6 w-6" />
>>>>>>> Stashed changes
                </div>
                <p className="text-3xl font-display font-bold text-surface-900">{value}</p>
                <p className="text-sm text-surface-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
<<<<<<< Updated upstream
        <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-accent p-12 lg:p-16">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-[80px] animate-blob" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-[80px] animate-blob animation-delay-2000" />
          <div className="absolute inset-0 bg-dots opacity-20" />
=======
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary-600 via-primary-500 to-accent p-10 lg:p-16">
          {/* Decorative */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-[80px]" />
            <div className="absolute inset-0 grid-pattern opacity-10" />
          </div>
          
>>>>>>> Stashed changes
          <div className="relative max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">Start Selling on Speedersmania</h2>
            <p className="mt-4 text-lg text-primary-100/80 leading-relaxed">
              Join thousands of vendors and reach millions of customers. Set up your store in minutes with our intuitive dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
<<<<<<< Updated upstream
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-primary-700 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98]">
=======
              <Link to="/register" className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-primary-700 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]">
>>>>>>> Stashed changes
                Become a Vendor
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/vendor" className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-transparent px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-all duration-300">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
<<<<<<< Updated upstream
=======

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Why Choose Us</span>
          <h2 className="text-3xl font-display font-bold text-surface-900 mt-2">Built for Modern Commerce</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'Lightning Fast', desc: 'Optimized performance with instant page loads and seamless interactions.', color: 'from-amber-500 to-orange-500' },
            { icon: Shield, title: 'Secure & Trusted', desc: 'Bank-grade security with verified vendors and buyer protection.', color: 'from-emerald-500 to-teal-500' },
            { icon: Gift, title: 'Curated Selection', desc: 'Hand-picked products from the best sellers across every category.', color: 'from-primary-500 to-accent' },
          ].map(({ icon: Icon, title, desc, color }, index) => (
            <div key={title} className="group relative p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-surface-100 shadow-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">{title}</h3>
              <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
>>>>>>> Stashed changes
    </div>
  );
}
