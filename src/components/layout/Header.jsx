import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Store, LayoutDashboard, LogOut, Package, Heart, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { searchProducts } from '../../config/firestore';
import { trackEvent } from '../../config/analytics';
import AuthModal from '../AuthModal';

export default function Header() {
  const { user, userRole, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
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
  const searchWrapRef = useRef(null);

  // Elevate header once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Debounced live search suggestions (min 2 chars)
  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchProducts(term);
        setSuggestions(results.slice(0, 5));
      } catch (err) {
        console.error('Search suggestions failed:', err);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
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
    }
  };

  const goToProduct = (id) => {
    setSearchQuery('');
    setShowSuggestions(false);
    navigate(`/products/${id}`);
  };

  const searchForm = (mobile = false) => (
    <div ref={searchWrapRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Search products, vendors..."
        className={`input-field pl-10 py-2 text-sm ${mobile ? '' : ''}`}
        aria-label="Search products"
        aria-expanded={showSuggestions}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => { setSearchQuery(''); setSuggestions([]); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showSuggestions && searchQuery.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-surface-100 bg-white p-2 shadow-premium z-50 animate-slide-down">
          {searching ? (
            <p className="px-3 py-2 text-xs text-surface-400">Searching…</p>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToProduct(s.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface-50 transition-colors"
                >
                  <img src={s.images?.[0] || s.image || `https://picsum.photos/seed/${s.id}/40/40`} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 line-clamp-1">{s.name}</p>
                    <p className="text-xs text-surface-500">{s.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">₹{Number(s.price || 0).toFixed(2)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleSearch}
                className="mt-1 flex w-full items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                See all results for "{searchQuery.trim()}"
              </button>
            </>
          ) : (
            <p className="px-3 py-2 text-xs text-surface-400">No products match "{searchQuery.trim()}"</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <header className={`sticky top-0 z-50 glass border-b transition-all duration-300 ${scrolled ? 'border-surface-200/60 shadow-soft' : 'border-surface-200/20 shadow-none'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent shadow-glow transition-transform duration-300 group-hover:scale-105">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-gradient hidden sm:block">Speedersmania</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            {searchForm()}
          </form>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/products" className="btn-ghost text-sm">
              <Package className="h-4 w-4" />
              <span>Browse</span>
            </Link>
            <Link to="/wishlist" className="btn-ghost text-sm">
              <Heart className="h-4 w-4" />
            </Link>
            <Link to="/cart" className="relative btn-ghost text-sm">
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-accent text-white text-xs font-bold">
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:block">{user?.displayName?.split(' ')[0] || 'User'}</span>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-surface-100 bg-white p-2 shadow-premium z-50 animate-slide-down">
                      <div className="px-3 py-2 border-b border-surface-100 mb-1">
                        <p className="text-sm font-semibold text-surface-900">{user?.displayName}</p>
                        <p className="text-xs text-surface-500">{user?.email}</p>
                      </div>
                      <Link
                        to={userRole === 'admin' ? '/admin' : userRole === 'vendor' ? '/vendor' : '/orders'}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      {userRole === 'vendor' && (
                        <>
                          <Link
                            to="/vendor/products"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                          >
                            <Package className="h-4 w-4" />
                            My Products
                          </Link>
                          <Link
                            to="/vendor/orders"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Vendor Orders
                          </Link>
                        </>
                      )}
                      <Link
                        to="/orders"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                      <button
                        onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
                  className="btn-ghost text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthModalMode('register'); setAuthModalOpen(true); }}
                  className="btn-primary text-sm py-2"
                >
                  Get Started
                </button>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <Link to="/cart" className="relative btn-ghost p-2">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[9px] font-bold text-white">
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
          <div className="border-t border-surface-100 py-4 md:hidden animate-slide-down">
            <form onSubmit={handleSearch} className="mb-4">
              {searchForm(true)}
            </form>
            <div className="flex flex-col gap-1">
              <Link to="/products" onClick={() => setMobileOpen(false)} className="btn-ghost justify-start">Browse Products</Link>
              {isAuthenticated ? (
                <>
                  <Link to={userRole === 'admin' ? '/admin' : userRole === 'vendor' ? '/vendor' : '/orders'} onClick={() => setMobileOpen(false)} className="btn-ghost justify-start">Dashboard</Link>
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="btn-ghost justify-start">My Orders</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-ghost justify-start text-red-600">Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setMobileOpen(false); setAuthModalMode('login'); setAuthModalOpen(true); }} className="btn-ghost justify-start">Sign In</button>
                  <button onClick={() => { setMobileOpen(false); setAuthModalMode('register'); setAuthModalOpen(true); }} className="btn-primary justify-center">Get Started</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </header>
  );
}
