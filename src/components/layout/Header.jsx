import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, User, Menu, X, Store, LayoutDashboard, LogOut,
  Package, Heart, ChevronDown, Truck, ShieldCheck, RotateCcw, BadgePercent,
  ChevronRight, Zap, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { searchProducts } from '../../config/firestore';
import { trackEvent } from '../../config/analytics';
import { inr } from '../../utils/currency';
import AuthModal from '../AuthModal';

const CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'home', name: 'Home & Living' },
  { id: 'sports', name: 'Sports' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'books', name: 'Books' },
];

export default function Header() {
  const { user, userRole, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [scrolled, setScrolled] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const searchWrapRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const catRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock the page behind the mobile drawer, and close overlays on Escape.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setMobileOpen(false);
      setCatOpen(false);
      setProfileOpen(false);
      setShowSuggestions(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const results = await searchProducts(term);
        if (!cancelled) setSuggestions(results.slice(0, 5));
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const onClick = (e) => {
      const inDesktopSearch = searchWrapRef.current?.contains(e.target);
      const inMobileSearch = mobileSearchRef.current?.contains(e.target);
      if (!inDesktopSearch && !inMobileSearch) {
        setShowSuggestions(false);
      }
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (term) {
      trackEvent('search', { search_term: term });
      navigate(`/products?q=${encodeURIComponent(term)}`);
      setSearchQuery('');
      setShowSuggestions(false);
      setMobileOpen(false);
    }
  };

  const goToProduct = (id) => {
    setSearchQuery('');
    setShowSuggestions(false);
    setMobileOpen(false);
    navigate(`/products/${id}`);
  };

  const searchForm = (mobile = false) => (
    <div ref={mobile ? mobileSearchRef : searchWrapRef} className="relative w-full">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Search products, vendors..."
        className={`input-field pl-11 text-sm`}
        aria-label="Search products"
        aria-expanded={showSuggestions}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => { setSearchQuery(''); setSuggestions([]); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {showSuggestions && searchQuery.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-3xl border border-surface-200/60 bg-white shadow-premium z-50 animate-fade-up">
          {searching ? (
            <p className="px-4 py-3 text-sm text-ink-muted">Searching…</p>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToProduct(s.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-surface-50 transition-all"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl overflow-hidden bg-surface-100">
                    <img
                      src={s.images?.[0] || s.image || `/product-placeholder.svg`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink line-clamp-1">{s.name}</p>
                    <p className="text-xs text-ink-muted">{s.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-ink">{inr(s.price)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleSearch}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-all"
              >
                <TrendingUp className="h-4 w-4" />
                See all results for &ldquo;{searchQuery.trim()}&rdquo;
              </button>
            </>
          ) : (
            <p className="px-4 py-3 text-sm text-ink-muted">No products match &ldquo;{searchQuery.trim()}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Announcement strip — scrolls away, nav stays pinned */}
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto whitespace-nowrap px-5 py-2.5 text-[11px] font-medium sm:px-8 lg:px-12 scrollbar-hide">
          <span className="inline-flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Free shipping over ₹999
          </span>
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span className="hidden items-center gap-2 sm:inline-flex">
            <BadgePercent className="h-3.5 w-3.5 text-accent" />
            Use code
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">WELCOME10</span>
            for 10% off
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-white/25 sm:block" />
          <span className="hidden items-center gap-2 md:inline-flex">
            <Truck className="h-3.5 w-3.5 text-accent" />
            Cash on delivery available
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-white/25 md:block" />
          <span className="hidden items-center gap-2 lg:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Buyer protection guaranteed
          </span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b transition-all duration-500 ease-smooth ${
          scrolled
            ? 'border-surface-200/60 bg-white/85 shadow-card backdrop-blur-2xl'
            : 'border-transparent bg-white/70 backdrop-blur-xl'
        }`}
      >
      {/* Scroll-shifted glow band */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-full z-[60] bg-gradient-to-r from-transparent via-primary-600 to-transparent opacity-0 transition-opacity duration-500 ${
          scrolled ? 'opacity-100' : ''
        }`}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 z-10">
        <div className="flex h-18 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 group relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent shadow-glow transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold tracking-tightest text-ink">
              Speedersmania
            </span>
            {/* Decorative underline on hover */}
            <span className="absolute -bottom-1.5 left-0 h-[2px] w-0 bg-primary-600 transition-all duration-500 group-hover:w-full" />
          </Link>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl">
            {searchForm()}
          </form>

          <nav className="hidden lg:flex items-center gap-3">
            <div ref={catRef} className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="btn-ghost text-sm relative"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Browse</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${catOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {catOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />
                  <div className="absolute left-0 top-full mt-3 w-72 rounded-3xl border border-surface-200/60 bg-white shadow-premium z-50 animate-fade-up">
                    <Link
                      to="/products"
                      onClick={() => setCatOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50 hover:text-primary-800 transition-all"
                    >
                      All Products
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/vendors"
                      onClick={() => setCatOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-surface-50 hover:text-ink transition-all"
                    >
                      All Vendors
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <div className="my-2 border-t border-surface-100/40" />
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${cat.id}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-50 hover:text-ink transition-all"
                      >
                        {cat.name}
                        <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
                      </Link>
                    ))}
                    <div className="my-2 border-t border-surface-100/40" />
                    <button
                      onClick={() => { setCatOpen(false); navigate('/products?sort=price-low&max=999'); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-all"
                    >
                      <BadgePercent className="h-4 w-4" />
                      Deals under ₹999
                    </button>
                  </div>
                </>
              )}
            </div>
            <Link to="/wishlist" className="btn-ghost p-2 relative group" aria-label="Wishlist">
              <div className="relative">
                <Heart className="h-5 w-5 icon-pop transition-transform" />
                {wishlistCount > 0 && (
                  <span key={wishlistCount} className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white shadow-sm badge-pop">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </div>
            </Link>
            <Link to="/cart" className="relative btn-ghost p-2">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span key={cartCount} className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white shadow-glow badge-pop">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface-100 transition-all"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-accent text-white text-xs font-bold shadow-glow">
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:block">{user?.displayName?.split(' ')[0] || 'User'}</span>
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-3 w-60 rounded-3xl border border-surface-200/60 bg-white shadow-premium z-50 animate-fade-up">
                      <div className="px-4 py-3 border-b border-surface-100/40 mb-3">
                        <p className="text-sm font-semibold text-ink">{user?.displayName}</p>
                        <p className="text-xs text-ink-muted">{user?.email}</p>
                      </div>
                      <Link
                        to={userRole === 'admin' ? '/admin' : userRole === 'vendor' ? '/vendor' : '/orders'}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-50 hover:text-ink transition-all"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      {userRole === 'vendor' && (
                        <>
                          <Link
                            to="/vendor/products"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-50 hover:text-ink transition-all"
                          >
                            <Package className="h-4 w-4" />
                            My Products
                          </Link>
                          <Link
                            to="/vendor/orders"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-50 hover:text-ink transition-all"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Vendor Orders
                          </Link>
                        </>
                      )}
                      <Link
                        to="/orders"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-50 hover:text-ink transition-all"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                      <button
                        onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
                  className="btn-ghost text-sm font-medium hover:text-primary-700 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthModalMode('register'); setAuthModalOpen(true); }}
                  className="btn-accent text-sm py-2.5 px-6"
                >
                  Get Started
                </button>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-3 lg:hidden">
            <Link to="/cart" className="relative btn-ghost p-2">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span key={cartCount} className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[9px] font-bold text-white shadow-glow badge-pop">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost p-2">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-surface-100 py-6 lg:hidden animate-fade-up bg-white/80 backdrop-blur">
            <form onSubmit={handleSearch} className="mb-6">
              {searchForm(true)}
            </form>
            <div className="flex flex-col gap-2">
              <Link to="/products" onClick={() => setMobileOpen(false)} className="btn-ghost justify-start text-sm font-medium">
                Browse Products
              </Link>
              <Link to="/vendors" onClick={() => setMobileOpen(false)} className="btn-ghost justify-start text-sm font-medium">
                Vendors
              </Link>
              <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="btn-ghost justify-start text-sm font-medium">
                Wishlist
                {wishlistCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>
              <div className="my-2 border-t border-surface-100/40" />
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="btn-ghost justify-start text-sm text-ink-soft"
                >
                  {cat.name}
                </Link>
              ))}
              <div className="my-2 border-t border-surface-100/40" />
              {isAuthenticated ? (
                <>
                  <Link to={userRole === 'admin' ? '/admin' : userRole === 'vendor' ? '/vendor' : '/orders'} onClick={() => setMobileOpen(false)} className="btn-ghost justify-start text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="btn-ghost justify-start text-sm font-medium">
                    My Orders
                  </Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-ghost justify-start text-sm font-medium text-red-600">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setMobileOpen(false); setAuthModalMode('login'); setAuthModalOpen(true); }} className="btn-ghost justify-start text-sm font-medium">
                    Sign In
                  </button>
                  <button onClick={() => { setMobileOpen(false); setAuthModalMode('register'); setAuthModalOpen(true); }} className="btn-accent justify-center text-sm py-2">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    </header>
    </>
  );
}
