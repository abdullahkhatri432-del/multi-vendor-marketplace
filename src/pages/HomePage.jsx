import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Sparkles, Shield, Truck, Headphones, Star, TrendingUp,
  Store, Award, Lock, RotateCcw, BadgeCheck,
  Cpu, Shirt, Home, Dumbbell, Sparkle, BookOpen,
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
import { Reveal, Marquee, Magnetic, Parallax } from '../components/ui/Motion';

import usePageMeta from '../hooks/usePageMeta';
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
    body: 'Secure UPI payments with a verifiable transaction reference, order tracking once your parcel ships, and email support if something goes wrong.',
    tint: 'bg-accent-light/30',
    accent: 'text-accent-dark',
    ring: 'from-accent/30 to-primary-500/10',
    icon: Shield,
    cta: { label: 'Start shopping', href: '/products' },
  },
];

// Fallback icon mapping only — category names and counts always come from data.
const categoryIcons = {
  electronics: Cpu,
  fashion: Shirt,
  home: Home,
  'home-living': Home,
  'home & living': Home,
  sports: Dumbbell,
  beauty: Sparkle,
  books: BookOpen,
};

export default function HomePage() {
  usePageMeta({
    title: 'Speedersmania — Multi-Vendor Marketplace',
    description:
      'Shop independent sellers with live stock, server-verified UPI payments and order tracking. Verified stores, transparent pricing.',
    path: '/',
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const displayCategories = useMemo(() => {
    if (categories.length > 0) return categories;

    // No category documents yet: derive real categories from the products that
    // actually exist. Never invent category names or item counts.
    const counts = new Map();
    products.forEach((product) => {
      const name = String(product?.category || '').trim();
      if (!name) return;
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const entry = counts.get(id) || { id, name, count: 0 };
      entry.count += 1;
      counts.set(id, entry);
    });
    return [...counts.values()];
  }, [categories, products]);

  const displayProducts = products.length > 0 ? products : (DEMO_ENABLED ? fallbackProducts : []);
  const displayVendors = (vendors.length > 0
    ? vendors
    : DEMO_ENABLED ? fallbackVendors : []
  ).map((vendor) => ({
    id: vendor.id,
    name: vendor.name || vendor.storeName || 'Store',
    logo: vendor.logo || '/product-placeholder.svg',
    rating: Number(vendor.rating) || 0,
    reviewCount: Number(vendor.reviewCount) || 0,
    productsCount: Number(vendor.productsCount ?? vendor.totalProducts) || 0,
    category: vendor.category || 'Marketplace',
    verified: Boolean(vendor.verified ?? vendor.isVerified),
    badge: vendor.verified ?? vendor.isVerified ? 'Verified' : null,
  }));

  // Hero spotlight uses the first real, verified store — never a hardcoded one.
  const spotlightVendor = displayVendors.find((vendor) => vendor.verified) || displayVendors[0] || null;

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
                className="font-display text-fluid-hero text-white"
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
                Shop independent sellers with live stock, server-verified UPI payments and
                order tracking from checkout to doorstep.
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
                  { icon: BadgeCheck, label: 'Verified sellers' },
                  { icon: Zap, label: 'Live stock' },
                  { icon: Lock, label: 'UPI checkout' },
                  { icon: Truck, label: 'Order tracking' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm font-medium text-primary-200/90">
                    <Icon className="h-4 w-4 text-accent-light" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor spotlight — rendered only when a real store exists */}
            {spotlightVendor && (
              <Parallax speed={0.05} className="relative hidden lg:block">
                <div className="absolute -inset-6 rounded-[3rem] bg-white/5 blur-2xl" aria-hidden />
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/10 p-8 backdrop-blur-2xl shadow-premium">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary-200/80">
                      Vendor spotlight
                    </span>
                    {spotlightVendor.verified && (
                      <BadgeCheck className="h-5 w-5 text-accent-light" aria-label="Verified vendor" />
                    )}
                  </div>
                  <div className="mt-8 flex items-center gap-5">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-accent-dark text-2xl font-display text-primary-950">
                      {spotlightVendor.logo && spotlightVendor.logo !== '/product-placeholder.svg' ? (
                        <img
                          src={spotlightVendor.logo}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        spotlightVendor.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-display text-2xl text-white">{spotlightVendor.name}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-primary-200">
                        {spotlightVendor.reviewCount > 0 ? (
                          <>
                            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                            {spotlightVendor.rating.toFixed(1)}
                            <span className="text-primary-300/70">
                              · {spotlightVendor.reviewCount.toLocaleString('en-IN')} reviews
                            </span>
                          </>
                        ) : (
                          <span className="text-primary-300/70">{spotlightVendor.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 space-y-3">
                    {[
                      { label: 'Products listed', value: String(spotlightVendor.productsCount) },
                      { label: 'Store status', value: spotlightVendor.verified ? 'Verified' : 'Pending review' },
                      { label: 'Ships via', value: 'Seller-fulfilled' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                        <span className="text-primary-200/70">{row.label}</span>
                        <span className="font-semibold text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={`/vendor/${spotlightVendor.id}`}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-primary-100 transition-colors hover:bg-white/20"
                  >
                    Visit store
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Parallax>
            )}
          </div>
        </div>
      </section>

      {/* ============================ TRUST BAR ============================ */}
      <section className="border-b border-surface-200/60 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
          <Reveal className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6" delay={80}>
            {[
              { icon: Lock, label: 'Server-verified UPI', desc: 'Payments matched to orders' },
              { icon: BadgeCheck, label: 'Verified sellers', desc: 'Admin-approved stores' },
              { icon: Zap, label: 'Live inventory', desc: 'Stock checked at checkout' },
              { icon: Truck, label: 'Order tracking', desc: 'Tracking once shipped' },
              { icon: RotateCcw, label: 'Returns', desc: 'Per seller policy' },
              { icon: Headphones, label: 'Email support', desc: 'support@speedersmania.com' },
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
      {displayVendors.length > 0 && (
        <section className="overflow-hidden border-b border-surface-200/60 bg-white py-6">
          <Marquee
            items={displayVendors.map((vendor) => vendor.name)}
            speed={34}
            renderItem={(name, i) => (
              <div key={`${name}-${i}`} className="flex items-center gap-2.5 text-surface-400">
                <Store className="h-4 w-4 text-primary-300" />
                <span className="whitespace-nowrap text-sm font-semibold uppercase tracking-wide">{name}</span>
              </div>
            )}
          />
        </section>
      )}

      {/* ============================ CATEGORIES =========================== */}
      {displayCategories.length > 0 && (
      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <Reveal className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">
                <Tag className="h-3.5 w-3.5 text-primary-600" />
                Shop by category
              </span>
              <h2 className="mt-4 font-display text-fluid-title text-ink">
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
      )}

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
                    className="group mt-9 inline-flex min-h-[28px] items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-primary-700"
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

      {/* ======================= SECURE CHECKOUT PANEL ==================== */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        <Reveal className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 p-8 shadow-card-hover lg:p-16">
          <div className="absolute inset-0 bg-dots-light opacity-20" aria-hidden />
          <div className="absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full bg-accent/20 blur-[160px] animate-blob" aria-hidden />
          <div className="absolute -bottom-28 -left-16 h-[400px] w-[400px] rounded-full bg-primary-400/20 blur-[160px] animate-blob animation-delay-2000" aria-hidden />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-xl text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-semibold text-accent-light backdrop-blur-sm">
                <Lock className="h-3.5 w-3.5" />
                How checkout works
              </div>
              <h2 className="font-display text-display-xs text-white sm:text-display-sm">
                Pay by UPI. Verified on the server.
              </h2>
              <p className="mt-4 font-light leading-relaxed text-primary-200/80">
                Your order is created with prices and stock recalculated on the server. Every UPI
                payment is matched against a transaction reference before an order is marked paid —
                a browser redirect alone is never treated as proof of payment.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4 lg:justify-start">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-primary-900 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.97]"
                >
                  Start shopping <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/terms"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                >
                  Payment terms
                </Link>
              </div>
            </div>

            <ol className="space-y-4">
              {[
                { step: '01', title: 'Server-priced order', body: 'Prices, discounts and stock are revalidated when the order is created.' },
                { step: '02', title: 'UPI payment', body: 'Pay the exact amount to the displayed UPI ID and keep the reference number.' },
                { step: '03', title: 'Reference match', body: 'Your UTR is matched to the order before payment is confirmed.' },
                { step: '04', title: 'Tracked fulfilment', body: 'Sellers update status and add tracking as your parcel moves.' },
              ].map((item) => (
                <li
                  key={item.step}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <span className="font-mono text-xs font-semibold tracking-[0.2em] text-accent-light">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-primary-200/75">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
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
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {displayProducts.slice(0, 8).map((product, idx) => (
                <Reveal key={product.id} delay={Math.min((idx % 4) * 90, 270)} className="h-full">
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
                          <span className="text-sm font-semibold text-ink">{Number(vendor.rating || 0).toFixed(1)}</span>
                          <span className="text-xs text-ink-muted">({Number(vendor.reviewCount || 0).toLocaleString('en-IN')})</span>
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

      {/* ====================== BUYER CONFIDENCE ========================= */}
      <section className="bg-white py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <span className="eyebrow justify-center">
              <Shield className="h-3.5 w-3.5 text-primary-600" />
              Buying with confidence
            </span>
            <h2 className="mt-4 font-display text-display-xs text-ink sm:text-display-sm">
              What the platform actually guarantees
            </h2>
            <p className="mt-3 text-sm text-ink-muted">
              No invented statistics. These are the checks the software enforces on every order.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Lock,
                title: 'Server-side pricing',
                body: 'Order totals are recalculated on the server from live product data. A tampered cart cannot change what you are charged.',
              },
              {
                icon: BadgeCheck,
                title: 'Verified-purchase reviews',
                body: 'Reviews are written through the API, which checks your order history. The verified badge only appears for real purchases.',
              },
              {
                icon: Truck,
                title: 'Visible order status',
                body: 'Every status change is recorded with a timestamp. When a seller ships your parcel, the tracking number appears on the order.',
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 90}>
                <article className="flex h-full flex-col rounded-[2rem] border border-surface-200/70 bg-surface-50 p-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.body}</p>
                </article>
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
              Open your store, list products and manage orders from one dashboard. New stores are
              reviewed before they go live.
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
