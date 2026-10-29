import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Sparkles, Shield, Truck, Headphones, Star, TrendingUp,
  Store, Award, Users as UsersIcon, Heart, MessageCircle, Lock, RotateCcw, BadgeCheck,
  ChevronLeft, ChevronRight, Cpu, Shirt, Home, Dumbbell, Sparkle, BookOpen,
  Zap, Tag,
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
import useStickyScene from '../hooks/useStickyScene';
import { Reveal, Counter, Marquee, Magnetic, Parallax } from '../components/ui/Motion';

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
    text: 'Love the eco-friendly filter. Finally a marketplace that lets me shop sustainably without compromising on style.',
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

const heroWords = ['Discover', 'Extraordinary', 'Products.', 'Verified', 'Sellers.', 'Zero', 'Compromise.'];

const storySteps = [
  {
    step: '01',
    title: 'Discover',
    subtitle: 'Curated collections, not endless aisles.',
    body: 'Thousands of hand-picked products across electronics, fashion, home and more. Every listing is reviewed before it reaches you.',
    tint: 'bg-surface-50',
    accent: 'text-primary-600',
    ring: 'from-primary-500/20 to-accent/10',
    icon: Sparkles,
    cta: { label: 'Browse the catalogue', href: '/products' },
  },
  {
    step: '02',
    title: 'Curated',
    subtitle: 'Every vendor earns their place.',
    body: 'We verify each seller before they join, so you always know who is behind the product. Trust is built in, not bolted on.',
    tint: 'bg-primary-50',
    accent: 'text-primary-700',
    ring: 'from-primary-600/25 to-primary-400/10',
    icon: BadgeCheck,
    cta: { label: 'Meet our vendors', href: '/vendors' },
  },
  {
    step: '03',
    title: 'Delivered',
    subtitle: 'Protected from checkout to doorstep.',
    body: 'Secure UPI payments with verified transaction references, tracked delivery, and seven-day easy returns on every order.',
    tint: 'bg-accent-light/30',
    accent: 'text-accent-dark',
    ring: 'from-accent/30 to-primary-500/10',
    icon: Shield,
    cta: { label: 'Start shopping', href: '/products' },
  },
];

const defaultCategories = [
  { id: 'electronics', name: 'Electronics', count: 234 },
  { id: 'fashion', name: 'Fashion', count: 189 },
  { id: 'home', name: 'Home & Living', count: 156 },
  { id: 'sports', name: 'Sports', count: 98 },
  { id: 'beauty', name: 'Beauty', count: 145 },
  { id: 'books', name: 'Books', count: 312 },
];

const categoryIcons = {
  electronics: Cpu,
  fashion: Shirt,
  home: Home,
  sports: Dumbbell,
  beauty: Sparkle,
  books: BookOpen,
};

const vendorMarquee = [
  'AudioTech Pro', 'Timeless Co.', 'EcoWear', 'SmartLiving',
  'ProOptics', 'WorkSpace Pro', 'BrewMasters', 'ZenFlow',
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 32, secs: 8 });

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [prods, cats, stores] = await Promise.all([
          getAllProducts(12),
          getAllCategories(),
          getVerifiedVendors().catch(() => []),
        ]);
        if (cancelled) return;
        setProducts(prods || []);
        setCategories(cats || []);
        setVendors(stores || []);
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Countdown timer for the deals panel
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

  const displayCategories = categories.length > 0 ? categories : defaultCategories;
  const displayProducts = products.length > 0 ? products : (DEMO_ENABLED ? fallbackProducts : []);
  const displayVendors = (vendors.length > 0
    ? vendors
    : DEMO_ENABLED ? fallbackVendors : []
  ).map((vendor) => ({
    id: vendor.id,
    name: vendor.name || vendor.storeName || 'Store',
    logo: vendor.logo || `https://picsum.photos/seed/${vendor.id}/140/140`,
    rating: Number(vendor.rating) || 0,
    reviewCount: Number(vendor.reviewCount) || 0,
    productsCount: Number(vendor.productsCount ?? vendor.totalProducts) || 0,
    category: vendor.category || 'Marketplace',
    verified: Boolean(vendor.verified ?? vendor.isVerified),
    badge: vendor.badge || (vendor.verified ? 'Verified' : null),
  }));

  const { containerRef, activeStep, stepProgress } = useStickyScene(storySteps.length);
  const activeStory = storySteps[activeStep] || storySteps[0];
  const ActiveStoryIcon = activeStory.icon;

  const goToStep = (index) => {
    const el = containerRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY + index * window.innerHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="relative bg-surface-50 text-ink">
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 py-24 text-white lg:py-32">
        <div className="absolute inset-0 bg-dots-light opacity-30" aria-hidden />
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-[10%] top-24 h-[500px] w-[500px] rounded-full bg-primary-500/30 blur-[160px] animate-blob" />
          <div className="absolute -right-[10%] bottom-20 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[200px] animate-blob animation-delay-2000" />
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-400/20 blur-[160px] animate-blob animation-delay-4000" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="text-center lg:text-left">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-semibold text-primary-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Curated multi-vendor marketplace
              </div>

              <h1
                aria-label="Discover extraordinary products. Verified sellers. Zero compromise."
                className="font-display text-display-sm text-white sm:text-display-md lg:text-display-lg"
              >
                {heroWords.map((word, i) => (
                  <span key={i} aria-hidden className="word-rise-wrap" style={{ marginRight: '0.22em' }}>
                    <span className="word-rise" style={{ animationDelay: `${i * 110}ms` }}>
                      {word}
                    </span>
                  </span>
                ))}
              </h1>

              <p className="mx-auto mt-7 max-w-xl text-lg font-light leading-relaxed text-primary-200/85 lg:mx-0">
                Shop from thousands of trusted sellers. Curated collections, secure UPI checkout,
                and buyer protection built for the modern era.
              </p>

              <div className="mt-11 flex flex-wrap justify-center gap-4 lg:justify-start">
                <Magnetic strength={10}>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-primary-900 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow active:scale-[0.97]"
                  >
                    Explore marketplace
                    <ArrowRight className="h-4 w-4 icon-nudge" />
                  </Link>
                </Magnetic>
                <Magnetic strength={8}>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                  >
                    Start selling
                  </Link>
                </Magnetic>
              </div>

              <div className="mt-11 flex flex-wrap justify-center gap-x-8 gap-y-4 lg:justify-start">
                {[
                  { icon: Shield, label: 'Buyer protection' },
                  { icon: Zap, label: 'Fast delivery' },
                  { icon: RotateCcw, label: '7-day returns' },
                  { icon: Lock, label: 'Secure payments' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm font-medium text-primary-200/90">
                    <Icon className="h-4 w-4 text-accent-light" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Editorial hero card */}
            <Parallax speed={0.05} className="relative hidden lg:block">
              <div className="absolute -inset-6 rounded-[3rem] bg-white/5 blur-2xl" aria-hidden />
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/10 p-8 backdrop-blur-2xl shadow-premium">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary-200/80">
                    Vendor spotlight
                  </span>
                  <BadgeCheck className="h-5 w-5 text-accent-light" />
                </div>
                <div className="mt-8 flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-accent-dark text-2xl font-display text-primary-950">
                    AT
                  </div>
                  <div>
                    <p className="font-display text-2xl text-white">AudioTech Pro</p>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-primary-200">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      4.9
                      <span className="text-primary-300/70">· 2,418 reviews</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  {[
                    { label: 'Orders fulfilled', value: '18,204' },
                    { label: 'On-time delivery', value: '99.2%' },
                    { label: 'Response time', value: '< 2 hrs' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                      <span className="text-primary-200/70">{row.label}</span>
                      <span className="font-semibold text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-primary-100">
                  <Shield className="h-3.5 w-3.5" />
                  Verified since 2021
                </div>
              </div>
            </Parallax>
          </div>
        </div>
      </section>

      {/* ============================ TRUST BAR ============================ */}
      <section className="border-b border-surface-200/60 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
          <Reveal className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6" delay={80}>
            {[
              { icon: Lock, label: 'Secure payments', desc: 'Encrypted checkout' },
              { icon: Shield, label: 'Verified sellers', desc: 'Background checked' },
              { icon: RotateCcw, label: 'Easy returns', desc: '7-day, no fuss' },
              { icon: BadgeCheck, label: 'Quality assured', desc: 'Authenticity verified' },
              { icon: Truck, label: 'Fast delivery', desc: '2-5 business days' },
              { icon: Headphones, label: '24/7 support', desc: 'Real humans, always' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="group flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-all duration-300 group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-glow">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink transition-colors group-hover:text-primary-700">{label}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============================= MARQUEE ============================= */}
      <section className="overflow-hidden border-b border-surface-200/60 bg-white py-6">
        <Marquee
          items={vendorMarquee}
          speed={34}
          renderItem={(name, i) => (
            <div key={`${name}-${i}`} className="flex items-center gap-2.5 text-surface-400">
              <Store className="h-4 w-4 text-primary-300" />
              <span className="whitespace-nowrap text-sm font-semibold uppercase tracking-wide">{name}</span>
            </div>
          )}
        />
      </section>

      {/* ============================ CATEGORIES =========================== */}
      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <Reveal className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">
                <Tag className="h-3.5 w-3.5 text-primary-600" />
                Shop by category
              </span>
              <h2 className="mt-4 font-display text-display-xs text-ink sm:text-display-sm">
                Explore the collections
              </h2>
            </div>
            <Link to="/products" className="btn-ghost self-start text-sm sm:self-auto">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {displayCategories.map((cat, idx) => {
              const Icon = categoryIcons[cat.id] || Store;
              return (
                <Reveal key={cat.id} delay={Math.min(idx * 70, 350)}>
                  <Link
                    to={`/products?category=${cat.id}`}
                    className="group flex h-full flex-col items-center gap-3 rounded-3xl border border-surface-200/70 bg-white p-7 text-center shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-card"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary-600 group-hover:to-primary-800 group-hover:text-white group-hover:shadow-glow">
                      <Icon className="h-7 w-7 transition-transform duration-500 group-hover:scale-110" />
                    </span>
                    <span className="text-sm font-semibold text-ink transition-colors group-hover:text-primary-700">
                      {cat.name}
                    </span>
                    <span className="text-xs text-ink-muted">{cat.count ? `${cat.count} items` : 'Explore'}</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================= SCROLLYTELLING SCENE ====================== */}
      <section className="relative" aria-label="How Speedersmania works">
        <div ref={containerRef} className="relative" style={{ height: `${storySteps.length * 100}vh` }}>
          <div className="sticky top-0 h-screen overflow-hidden">
            {/* Crossfading tint */}
            {storySteps.map((step, i) => (
              <div
                key={step.step}
                aria-hidden
                className={`absolute inset-0 transition-opacity duration-700 ${step.tint} ${
                  i === activeStep ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}

            <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-8 lg:px-12">
              <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
                <div key={`copy-${activeStep}`} className="animate-fade-up">
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-xs font-semibold tracking-[0.3em] ${activeStory.accent}`}>
                      {activeStory.step} / 0{storySteps.length}
                    </span>
                    <span className="h-px w-10 bg-ink/15" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-ink-muted">
                      {activeStory.title}
                    </span>
                  </div>

                  <h2 className="mt-6 font-display text-display-xs text-ink sm:text-display-sm lg:text-display-md">
                    {activeStory.subtitle}
                  </h2>

                  <p className="mt-6 max-w-lg text-lg font-light leading-relaxed text-ink-soft">
                    {activeStory.body}
                  </p>

                  <Link
                    to={activeStory.cta.href}
                    className="group mt-9 inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-primary-700"
                  >
                    {activeStory.cta.label}
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div key={`panel-${activeStep}`} className="relative hidden animate-scale-in lg:block">
                  <div className={`absolute -inset-8 rounded-[3.5rem] bg-gradient-to-br ${activeStory.ring} blur-2xl`} aria-hidden />
                  <div className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/70 p-10 shadow-premium backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <span className="badge bg-ink text-white">Step {activeStory.step}</span>
                      <ActiveStoryIcon className={`h-6 w-6 ${activeStory.accent}`} />
                    </div>
                    <div>
                      <p className="font-display text-6xl text-ink/10">{activeStory.step}</p>
                      <p className="mt-2 font-display text-3xl text-ink">{activeStory.title}</p>
                      <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
                        {activeStory.body}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step rail */}
              <div className="mt-14 flex items-center gap-4">
                {storySteps.map((step, i) => {
                  const fill = i < activeStep ? 100 : i === activeStep ? stepProgress * 100 : 0;
                  return (
                    <button
                      key={step.step}
                      type="button"
                      onClick={() => goToStep(i)}
                      aria-label={`Go to step ${i + 1}: ${step.title}`}
                      aria-current={i === activeStep ? 'step' : undefined}
                      className="group flex flex-1 flex-col gap-2 text-left"
                    >
                      <span className="h-0.5 w-full overflow-hidden rounded-full bg-ink/10">
                        <span
                          className="block h-full rounded-full bg-ink transition-[width] duration-150"
                          style={{ width: `${fill}%` }}
                        />
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-[0.22em] transition-colors ${
                          i === activeStep ? 'text-ink' : 'text-ink-muted group-hover:text-ink-soft'
                        }`}
                      >
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= FLASH DEALS ========================== */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        <Reveal className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 p-8 shadow-card-hover lg:p-16">
          <div className="absolute inset-0 bg-dots-light opacity-20" aria-hidden />
          <div className="absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full bg-accent/20 blur-[160px] animate-blob" aria-hidden />
          <div className="absolute -bottom-28 -left-16 h-[400px] w-[400px] rounded-full bg-primary-400/20 blur-[160px] animate-blob animation-delay-2000" aria-hidden />

          <div className="relative flex flex-col items-center justify-between gap-10 lg:flex-row">
            <div className="max-w-xl text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-semibold text-accent-light backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                Limited time offer
              </div>
              <h2 className="font-display text-display-xs text-white sm:text-display-sm">
                Flash deals — up to 60% off
              </h2>
              <p className="mt-4 font-light leading-relaxed text-primary-200/80">
                Hand-picked deals from top vendors. Prices drop every hour — grab them before they are gone.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4 lg:justify-start">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-primary-900 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.97]"
                >
                  Shop deals <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                >
                  Browse all
                </Link>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4 text-white">
              {[
                { value: pad(timeLeft.hours), label: 'Hours' },
                { value: pad(timeLeft.mins), label: 'Mins' },
                { value: pad(timeLeft.secs), label: 'Secs' },
              ].map((unit) => (
                <div key={unit.label} className="flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/10 font-display text-3xl font-bold tabular-nums shadow-inner-glow backdrop-blur-sm sm:h-24 sm:w-24">
                    {unit.value}
                  </div>
                  <span className="mt-3 text-xs font-medium text-primary-200">{unit.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ======================== FEATURED PRODUCTS ====================== */}
      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <Reveal className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">
                <TrendingUp className="h-3.5 w-3.5 text-primary-600" />
                Trending now
              </span>
              <h2 className="mt-4 font-display text-display-xs text-ink sm:text-display-sm">
                Featured products
              </h2>
            </div>
            <Link to="/products" className="btn-ghost self-start text-sm sm:self-auto">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {displayProducts.slice(0, 8).map((product, idx) => (
                <Reveal key={product.id} delay={Math.min((idx % 4) * 90, 270)}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-surface-300 bg-surface-50 p-16 text-center">
              <Store className="mx-auto h-8 w-8 text-ink-muted" />
              <p className="mt-4 font-display text-2xl text-ink">The shelves are being stocked</p>
              <p className="mt-2 text-sm text-ink-muted">New products land here as vendors publish them.</p>
              <Link to="/products" className="btn-primary mt-6 inline-flex">Browse all products</Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================ VENDORS ============================ */}
      {displayVendors.length > 0 && (
        <section className="py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <Reveal className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="eyebrow">
                  <Award className="h-3.5 w-3.5 text-primary-600" />
                  Top stores
                </span>
                <h2 className="mt-4 font-display text-display-xs text-ink sm:text-display-sm">
                  Verified vendors
                </h2>
              </div>
              <Link to="/vendors" className="btn-ghost self-start text-sm sm:self-auto">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {displayVendors.slice(0, 6).map((vendor, idx) => (
                <Reveal key={vendor.id} delay={Math.min(idx * 70, 350)}>
                  <Link
                    to={`/vendor/${vendor.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-surface-200/70 bg-white transition-all duration-500 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-card-hover"
                  >
                    <div className="p-6">
                      <div className="relative mx-auto mb-5">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary-50 to-accent/20 transition-all duration-500 group-hover:from-primary-600 group-hover:to-primary-800">
                          <img
                            src={vendor.logo}
                            alt={vendor.name}
                            className="h-16 w-16 rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        {vendor.badge && (
                          <span className="absolute -top-2 right-0 inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            {vendor.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="line-clamp-1 font-semibold text-ink transition-colors group-hover:text-primary-700">
                          {vendor.name}
                        </h3>
                        <p className="mt-1 text-xs capitalize text-ink-muted">{vendor.category}</p>
                        <div className="mt-3 flex items-center justify-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          <span className="text-sm font-semibold text-ink">{vendor.rating.toFixed(1)}</span>
                          <span className="text-xs text-ink-muted">({vendor.reviewCount.toLocaleString()})</span>
                          {vendor.verified && <BadgeCheck className="h-4 w-4 text-primary-600" aria-label="Verified vendor" />}
                        </div>
                        <p className="mt-2 text-xs text-ink-muted">{vendor.productsCount} products</p>
                      </div>
                    </div>
                    <div className="mt-auto border-t border-surface-200/60 bg-surface-50 px-6 py-3.5">
                      <span className="block rounded-xl bg-primary-50 px-4 py-2 text-center text-xs font-semibold text-primary-700 transition-colors duration-300 group-hover:bg-primary-600 group-hover:text-white">
                        Visit store
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================== TESTIMONIALS ========================== */}
      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <Reveal className="mx-auto mb-16 max-w-2xl text-center">
            <span className="eyebrow justify-center">
              <MessageCircle className="h-3.5 w-3.5 text-primary-600" />
              Social proof
            </span>
            <h2 className="mt-4 font-display text-display-xs text-ink sm:text-display-sm">
              What our community says
            </h2>
            <p className="mt-3 text-sm text-ink-muted">Real experiences from buyers and sellers.</p>
          </Reveal>

          <div className="relative mx-auto max-w-4xl">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-1000 ease-smooth"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="w-full flex-shrink-0 px-2 sm:px-4">
                    <article className="mx-auto max-w-xl rounded-[2rem] border border-surface-200/70 bg-surface-50 p-8 sm:p-10">
                      <div className="mb-6 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${i < testimonial.rating ? 'fill-accent text-accent' : 'text-surface-200'}`}
                          />
                        ))}
                      </div>
                      <blockquote className="mb-8 font-display text-xl leading-relaxed text-ink sm:text-2xl">
                        &ldquo;{testimonial.text}&rdquo;
                      </blockquote>
                      <div className="flex items-center gap-4">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                          loading="lazy"
                        />
                        <div>
                          <p className="font-semibold text-ink">{testimonial.name}</p>
                          <p className="text-xs text-ink-muted">{testimonial.location}</p>
                        </div>
                        {testimonial.verified && (
                          <div className="ml-auto flex items-center gap-1 text-primary-600">
                            <BadgeCheck className="h-4 w-4" />
                            <span className="text-xs font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex items-center justify-center gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'w-10 bg-primary-600' : 'w-2.5 bg-surface-300 hover:bg-surface-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-y-0 -left-4 hidden items-center sm:flex">
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-surface-200 bg-white text-ink-soft shadow-card transition-all hover:text-primary-600 active:scale-95"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="pointer-events-none absolute inset-y-0 -right-4 hidden items-center sm:flex">
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-surface-200 bg-white text-ink-soft shadow-card transition-all hover:text-primary-600 active:scale-95"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { icon: UsersIcon, value: 500, suffix: 'K+', label: 'Happy customers' },
              { icon: Store, value: 10, suffix: 'K+', label: 'Verified vendors' },
              { icon: Award, value: 1, suffix: 'M+', label: 'Products listed' },
              { icon: Heart, value: 4.9, decimals: 1, suffix: '/5', label: 'Average rating' },
            ].map((stat, index) => (
              <Reveal key={stat.label} delay={index * 90} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <stat.icon className="h-6 w-6" />
                </div>
                <Counter
                  value={stat.value}
                  decimals={stat.decimals || 0}
                  suffix={stat.suffix}
                  className="block font-display text-4xl font-bold text-ink lg:text-5xl"
                />
                <p className="mt-2 text-sm text-ink-muted">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        <Reveal className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-8 py-20 text-center shadow-card-hover lg:px-24">
          <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-white/10 blur-[140px] animate-blob" aria-hidden />
          <div className="absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[140px] animate-blob animation-delay-2000" aria-hidden />
          <div className="absolute inset-0 bg-dots-light opacity-15" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-200">
              For sellers
            </span>
            <h2 className="mt-5 font-display text-display-xs text-white sm:text-display-sm lg:text-display-md">
              Turn your store into a destination
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg font-light text-primary-100/85">
              Join thousands of vendors reaching millions of customers. Set up your store in minutes.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-sm font-semibold text-primary-800 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-[0.97]"
              >
                Become a vendor <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/vendors"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-9 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
              >
                Learn more
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
