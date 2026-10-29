import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Shield, Truck, Headphones, Star, TrendingUp,
  Store, Award, Users, Heart, MessageCircle, Lock, RotateCcw, BadgeCheck,
  ChevronLeft, ChevronRight, Cpu, Shirt, Home, Dumbbell, Sparkle, BookOpen,
  Zap, Clock, Tag, Users as UsersIcon, BadgePercent,
} from 'lucide-react';
import {
  getAllProducts,
  getAllCategories,
  getVerifiedVendors,
  DEMO_ENABLED,
} from '../config/firestore';
import { fallbackProducts, fallbackVendors } from '../config/fallbackData';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useScrollReveal from '../hooks/useScrollReveal';
import useCountUp from '../hooks/useCountUp';
import useStickyScene from '../hooks/useStickyScene';
import { Reveal, TiltCard, Counter, Marquee, ScrollProgressBar } from '../components/ui/Motion';

const testimonials = [
  {
    id: 'test-1',
    name: 'Sarah Mitchell',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    rating: 5,
    text: 'Speedersmania has completely transformed how I shop online. The curated selection from verified vendors means I never have to worry about quality.',
    location: 'San Francisco, CA',
    verified: true,
  },
  {
    id: 'test-2',
    name: 'James Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    rating: 5,
    text: 'As a vendor, the platform tools are incredible. My sales tripled in the first quarter after joining Speedersmania.',
    location: 'Austin, TX',
    verified: true,
  },
  {
    id: 'test-3',
    name: 'Maria Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    rating: 5,
    text: 'Love the eco-friendly filter! Finally a marketplace that lets me shop sustainably.',
    location: 'Portland, OR',
    verified: true,
  },
  {
    id: 'test-4',
    name: 'David Park',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    rating: 5,
    text: 'The buyer protection is real. Full refund within 24 hours. This level of customer care is rare.',
    location: 'Seattle, WA',
    verified: true,
  },
];

const heroWords = [
  'Discover',
  'Extraordinary',
  'Products.',
  'Verified',
  'Sellers.',
  'Zero',
  'Compromise.',
];

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 32, secs: 8 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cats, stores] = await Promise.all([
          getAllProducts(12),
          getAllCategories(),
          getVerifiedVendors().catch(() => []),
        ]);
        setProducts(prods);
        setCategories(cats);
        setVendors(stores);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Countdown timer
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

  // Testimonial autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

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
  const displayProducts = products.length > 0 ? products : (DEMO_ENABLED ? fallbackProducts : []);
  const displayVendors = (vendors.length > 0
    ? vendors
    : DEMO_ENABLED ? fallbackVendors : []
  ).map((vendor) => ({
    id: vendor.id,
    name: vendor.name || vendor.storeName || 'Store',
    logo: vendor.logo || `https://picsum.photos/seed/${vendor.id}/140/140`,
    rating: vendor.rating || 0,
    reviewCount: Number(vendor.reviewCount) || 0,
    productsCount: Number(vendor.productsCount ?? vendor.totalProducts) || 0,
    category: vendor.category || 'Marketplace',
    verified: Boolean(vendor.verified ?? vendor.isVerified),
    badge: vendor.badge || (vendor.verified ? 'Verified' : null),
  }));
  const currentTestimonialData = testimonials[currentTestimonial];

  // Scroll reveal refs
  const revealHero = useScrollReveal({ threshold: 0.05 });
  const revealTrust = useScrollReveal({ threshold: 0.1 });
  const revealCategories = useScrollReveal({ threshold: 0.1 });
  const revealProducts = useScrollReveal({ threshold: 0.1 });
  const revealFlash = useScrollReveal({ threshold: 0.1 });
  const revealVendors = useScrollReveal({ threshold: 0.1 });
  const revealTestimonials = useScrollReveal({ threshold: 0.1 });
  const revealCta = useScrollReveal({ threshold: 0.1 });
  const revealStats = useScrollReveal({ threshold: 0.15 });

  // Scrollytelling pinned scene
  const storySteps = [
    {
      title: 'Discover',
      subtitle: 'Curated Collections',
      body: 'Browse thousands of hand-picked products across electronics, fashion, home, and more. Every listing is vetted for quality.',
      color: 'primary',
    },
    {
      title: 'Curated',
      subtitle: 'Verified Vendors',
      body: 'We background-check every seller before they join. Shop with confidence knowing who you&rsquo;re buying from.',
      color: 'accent',
    },
    {
      title: 'Delivered',
      subtitle: 'Buyer Protection',
      body: 'Secure UPI payments, verified UTR references, and 7-day easy returns. We&rsquo;ve got you covered end-to-end.',
      color: 'primary',
    },
  ];
  const { containerRef, progress: storyProgress, activeStep, stepProgress, windowHeight } = useStickyScene(storySteps);

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 relative overflow-hidden">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-accent dark:text-white py-24 lg:py-32" ref={revealHero.ref}>
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-[-10%] h-[500px] w-[500px] rounded-full bg-primary-500/30 blur-[160px] animate-blob" />
          <div className="absolute bottom-20 right-[-10%] h-[600px] w-[600px] rounded-full bg-accent-dark/40 blur-[200px] animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary-400/20 blur-[160px] animate-blob animation-delay-4000" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            {/* Animated word-rise hero text */}
            <div className="text-center lg:text-left mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-xs font-semibold text-primary-200 backdrop-blur-md border border-white/10 mb-8 animate-float">
                <Sparkles className="h-3.5 w-3.5" />
                Curated Multi-Vendor Marketplace
              </div>
              <h1 className="text-display-xl font-display font-bold text-white leading-tight mb-6 text-center lg:text-left">
                {heroWords.map((word, i) => (
                  <span key={i} className={`word-rise-wrap ${i === 0 ? 'delay-100' : i === 1 ? 'delay-200' : i === 2 ? 'delay-300' : i === 3 ? 'delay-400' : i === 4 ? 'delay-500' : i === 5 ? 'delay-600' : 'delay-700'}`}>
                    <span className="word-rise" style={{ animationDelay: `${i * 120}ms` }}>
                      {word}{' '}
                    </span>
                  </span>
                ))}
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-primary-200/80 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
                Shop from thousands of trusted sellers. Curated collections, seamless UPI checkout, and buyer protection built for the modern era.
              </p>
              <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-primary-900 shadow-card hover:-translate-y-1 hover:shadow-glow active:scale-[0.97] transition-all"
                >
                  Explore Marketplace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:-translate-y-1"
                >
                  Start Selling
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4">
                {[
                  { icon: Shield, label: 'Buyer Protection' },
                  { icon: Zap, label: '2-Day Delivery' },
                  { icon: RotateCcw, label: '7-Day Returns' },
                  { icon: Lock, label: 'Secure Payments' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-primary-200/90 font-medium">
                    <Icon className="h-4 w-4 text-primary-300" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BAR ============ */}
      {revealTrust.isVisible && (
      <section className="border-b border-surface-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              { icon: Lock, label: 'Secure Payments', desc: 'SSL encrypted checkout' },
              { icon: Shield, label: 'Verified Sellers', desc: 'Background-checked vendors' },
              { icon: RotateCcw, label: 'Easy Returns', desc: '7-day hassle-free returns' },
              { icon: BadgeCheck, label: 'Quality Guarantee', desc: 'Authenticity verified' },
              { icon: Truck, label: 'Fast Delivery', desc: '2-5 business days' },
              { icon: Headphones, label: '24/7 Support', desc: 'Dedicated help center' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 group cursor-default">
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
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
      )}

      {/* ============ MARQUEE ============ */}
      <section className="border-b border-surface-100 bg-white py-6 overflow-hidden">
        <div className="relative flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-16 pr-16 whitespace-nowrap">
            {['AudioTech Pro', 'Timeless Co.', 'EcoWear', 'SmartLiving', 'ProOptics', 'WorkSpace Pro', 'BrewMasters', 'ZenFlow']
              .concat(['AudioTech Pro', 'Timeless Co.', 'EcoWear', 'SmartLiving', 'ProOptics', 'WorkSpace Pro', 'BrewMasters', 'ZenFlow'])
              .map((name, i) => (
                <div key={i} className="flex items-center gap-2.5 text-surface-400">
                  <Store className="h-4 w-4 text-primary-300" />
                  <span className="text-sm font-semibold tracking-wide uppercase">{name}</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      {revealCategories.isVisible && (
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Shop by Category</span>
            </div>
            <h2 className="text-4xl font-display font-bold text-surface-900">Explore Collections</h2>
            <Link to="/products" className="btn-ghost text-sm">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {displayCategories.map((cat) => {
              const Icon = categoryIcons[cat.id] || Store;
              return (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="group flex flex-col items-center gap-3 rounded-3xl border border-surface-200/60 bg-white p-7 text-center shadow-soft transition-all duration-500 hover:border-primary-200 hover:shadow-card hover:-translate-y-1"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary-600 group-hover:to-accent group-hover:text-white group-hover:shadow-glow">
                    <Icon className="h-7 w-7 transition-transform duration-500 group-hover:scale-110" />
                  </span>
                  <span className="text-sm font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">{cat.name}</span>
                  <span className="text-xs text-surface-500">{cat.count || 0} items</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* ============ SCROLLYTELLING PINNED SCENE ============ */}
      <section className="relative">
        <div ref={containerRef} className="relative min-h-[calc(100vh*3)]">
          {/* Pinned panel */}
          <div className="sticky top-0 h-screen flex items-center justify-center">
            <div
              className="max-w-lg text-center opacity-0 transition-opacity duration-1000"
              style={{
                opacity: Math.max(0, Math.min(1, stepProgress * 2 + (progress * 3 > 2 ? 0 : 0))),
                transform: `translateY(${Math.max(0, (1 - stepProgress) * 60)}px)`,
              }}
            >
              <div className="flex justify-center mb-4">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${
                  storySteps[activeStep]?.color === 'primary'
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-accent-light text-accent-dark'
                }`}>
                  <span className="h-2 w-2 rounded-full bg-current"></span>
                  {storySteps[activeStep]?.title}
                </span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-display font-bold text-surface-900 mb-4 font-light">
                {storySteps[activeStep]?.subtitle}
              </h2>
              <p className="text-lg text-surface-500 leading-relaxed font-light">
                {storySteps[activeStep]?.body}
              </p>
            </div>
          </div>
          {/* Background bands for each step */}
          {storySteps.map((step, i) => (
            <div
              key={step.title}
              className={`absolute inset-0 h-screen flex items-center justify-center transition-colors duration-1000 ${
                progress * 3 > i && progress * 3 < i + 1
                  ? step.color === 'primary'
                    ? 'bg-primary-50'
                    : 'bg-accent-light'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      {revealProducts.isVisible && (
      <section className="bg-surface-50 py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Trending Now</span>
            </div>
            <div className="flex items-end gap-4">
              <h2 className="text-4xl font-display font-bold text-surface-900">Featured Products</h2>
              <Link to="/products" className="btn-ghost text-sm">
                See All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {displayProducts.slice(0, 8).map((product, idx) => (
              <div key={product.id} className={`reveal delay-${idx * 80}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {loading && products.length === 0 && (
            <div className="mt-16 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </div>
      </section>
      )}

      {/* ============ FLASH DEALS ============ */}
      {revealFlash.isVisible && (
      <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-28">
        <div className="reveal relative overflow-hidden rounded-[3rem] bg-gradient-to-r from-primary-950 via-primary-900 to-primary-800 p-8 lg:p-16 shadow-card-hover dark:bg-primary-950">
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full bg-accent-dark/30 blur-[160px] animate-blob" />
          <div className="absolute -bottom-28 -left-16 h-[400px] w-[400px] rounded-full bg-primary-400/20 blur-[160px] animate-blob animation-delay-2000" />
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-xs font-semibold text-accent-light backdrop-blur-sm mb-5">
                <Zap className="h-3.5 w-3.5" />
                Limited Time Offer
              </div>
              <h2 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-3">
                Flash Deals — up to 60% off
              </h2>
              <p className="text-primary-200/80 leading-relaxed font-light">
                Hand-picked deals from top vendors. Prices drop every hour — grab them before they&rsquo;re gone.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-sm font-semibold text-primary-900 shadow-xl hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.97] transition-all">
                  Shop Deals <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/products" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-9 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10">
                  Browse All
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-5 text-white shrink-0">
              {[
                { value: pad(timeLeft.hours), label: 'Hours' },
                { value: pad(timeLeft.mins), label: 'Mins' },
                { value: pad(timeLeft.secs), label: 'Secs' },
              ].map((unit) => (
                <div key={unit.label} className="flex flex-col items-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/10 border border-white/15 backdrop-blur-sm font-display text-3xl font-bold tabular-nums shadow-inner-glow">
                    {unit.value}
                  </div>
                  <span className="mt-3 text-xs font-medium text-primary-200">{unit.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ============ VERIFIED VENDORS ============ */}
      {displayVendors.length > 0 && revealVendors.isVisible && (
      <section className="py-28 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Top Stores</span>
            </div>
            <div className="flex items-end gap-4">
              <h2 className="text-4xl font-display font-bold text-surface-900">Verified Vendors</h2>
              <Link to="/vendors" className="btn-ghost text-sm">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {displayVendors.map((vendor) => (
              <Link
                key={vendor.id}
                to={`/vendor/${vendor.id}`}
                className="group card bg-white border border-surface-200/60 hover:border-primary-200 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-500"
              >
                <div className="p-7">
                  <div className="relative mb-6">
                    <div className="flex h-28 w-28 items-center justify-center rounded-[3rem] bg-gradient-to-br from-primary-50 to-accent/20 mx-auto transition-all duration-500 group-hover:from-primary-600 group-hover:to-accent">
                      <img
                        src={vendor.logo}
                        alt={vendor.name}
                        className="h-20 w-20 rounded-[2rem] object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    {vendor.badge && (
                      <div className="absolute -top-3 right-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
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
                        <span className="text-sm font-semibold text-surface-900">{vendor.rating}</span>
                        <span className="text-xs text-surface-500">({vendor.reviewCount.toLocaleString()})</span>
                      </div>
                      {vendor.verified && (
                        <BadgeCheck className="h-4 w-4 text-primary-600" title="Verified Vendor" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-surface-500">{vendor.productsCount} products</p>
                  </div>
                </div>
                <div className="bg-surface-50 border-t border-surface-200/40 px-7 py-4">
                  <span className="w-full rounded-xl bg-primary-100 px-4 py-2 text-center text-xs font-medium text-primary-700 transition-colors duration-300 group-hover:bg-primary-600 group-hover:text-white">
                    Visit Store
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ============ TESTIMONIALS ============ */}
      {revealTestimonials.isVisible && (
      <section className="bg-surface-50 py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="text-center mb-20 reveal">
            <div className="inline-flex items-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Social Proof</span>
            </div>
            <h2 className="text-4xl font-display font-bold text-surface-900">What Our Community Says</h2>
            <p className="mt-2 text-sm text-surface-500 max-w-2xl mx-auto">Real experiences from buyers and sellers</p>
          </div>

          <div className="relative max-w-4xl mx-auto reveal">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-1000 ease-smooth"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                    <article className="card bg-white max-w-xl mx-auto hover:border-primary-100">
                      <div className="p-10">
                        <div className="flex items-center gap-1 mb-6">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-surface-200'}`}
                            />
                          ))}
                        </div>
                        <blockquote className="text-base lg:text-lg text-surface-700 leading-relaxed mb-8 font-light italic">
                          &ldquo;{testimonial.text}&rdquo;
                        </blockquote>
                        <div className="flex items-center gap-5">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="h-16 w-16 rounded-full ring-2 ring-primary-100 object-cover"
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

            <div className="flex justify-center gap-3 mt-16">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-primary-600 w-10' : 'bg-surface-300 hover:bg-surface-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-between pointer-events-none -mx-4">
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-surface-600 shadow-card hover:bg-white hover:text-primary-600 transition-all active:scale-95"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-surface-600 shadow-card hover:bg-white hover:text-primary-600 transition-all active:scale-95"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: UsersIcon, value: '500K+', label: 'Happy Customers' },
              { icon: Store, value: '10K+', label: 'Verified Vendors' },
              { icon: Award, value: '1M+', label: 'Products Listed' },
              { icon: Heart, value: '4.9/5', label: 'Avg. Rating' },
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 reveal delay-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-[3rem] bg-gradient-to-br from-primary-50 to-accent/10 text-primary-600 mx-auto mb-5 transition-transform duration-300 hover:scale-110 hover:shadow-glow">
                  <stat.icon className="h-6 w-6" />
                </div>
                <Counter value={index < 2 ? (index === 0 ? 500000 : 10000) : index === 2 ? 1000000 : 49} className="text-4xl lg:text-5xl font-display font-bold text-surface-900 block" />
                <p className="text-sm text-surface-500 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ============ CTA ============ */}
      {revealCta.isVisible && (
      <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-28">
        <div className="reveal relative overflow-hidden rounded-[3.5rem] bg-gradient-to-r from-primary-600 via-primary-700 to-accent p-10 lg:p-24 shadow-card-hover">
          <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-white/10 blur-[160px] animate-blob" />
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-white/5 blur-[160px] animate-blob animation-delay-2000" />
          <div className="absolute inset-0 bg-dots opacity-15" />
          <div className="relative max-w-3xl text-center">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-5">Start Selling on Speedersmania</h2>
            <p className="text-lg text-primary-100/80 mb-12 max-w-lg mx-auto font-light">
              Join thousands of vendors and reach millions of customers. Set up your store in minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-5 text-sm font-semibold text-primary-700 shadow-xl hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-[0.97] transition-all"
              >
                Become a Vendor
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/vendor"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-transparent px-10 py-5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
