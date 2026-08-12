import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
<<<<<<< Updated upstream
import { SlidersHorizontal, Grid3X3, LayoutList, X, Star, Store, Clock } from 'lucide-react';
import { getAllProducts, searchProducts, getAllVendors, getProduct } from '../config/firestore';
=======
import { SlidersHorizontal, Grid3X3, LayoutList, X, Search, ChevronDown, Sparkles } from 'lucide-react';
import { getAllProducts, searchProducts } from '../config/firestore';
>>>>>>> Stashed changes
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { trackEvent } from '../config/analytics';

const RECENT_KEY = 'speedersmania_recently_viewed';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedVendor, setSelectedVendor] = useState(searchParams.get('vendor') || '');
  const [vendors, setVendors] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);
  const [recentProducts, setRecentProducts] = useState([]);

  const query = searchParams.get('q') || '';

  // Load recently viewed products from localStorage
  useEffect(() => {
    let ids = [];
    try {
      ids = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      ids = [];
    }
    if (ids.length === 0) return;
    let cancelled = false;
    Promise.all(
      ids
        .filter((id) => !query || query.trim().length === 0)
        .slice(0, 4)
        .map((id) => getProduct(id).catch(() => null))
    ).then((items) => {
      if (!cancelled) setRecentProducts(items.filter(Boolean));
    });
    return () => { cancelled = true; };
  }, [query]);

  const categories = [
    { id: '', name: 'All Categories', icon: '🛒' },
    { id: 'electronics', name: 'Electronics', icon: '💻' },
    { id: 'fashion', name: 'Fashion', icon: '👗' },
    { id: 'home', name: 'Home & Living', icon: '🏠' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'beauty', name: 'Beauty', icon: '✨' },
    { id: 'books', name: 'Books', icon: '📚' },
  ];

  useEffect(() => {
    getAllVendors().then(setVendors).catch((err) => console.error('Failed to load vendors:', err));
  }, []);

  useEffect(() => {
    if (query) {
      trackEvent('view_search_results', { search_term: query });
    } else {
      trackEvent('view_item_list', { item_list_name: 'products' });
    }
  }, [query]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let result;
        if (query) {
          result = await searchProducts(query);
        } else {
          result = await getAllProducts(100);
        }

        if (selectedCategory) {
          result = result.filter((p) => p.category === selectedCategory);
        }
        if (selectedVendor) {
          result = result.filter((p) => p.vendorId === selectedVendor);
        }
        if (minRating > 0) {
          result = result.filter((p) => (p.rating || 0) >= minRating);
        }
        result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

        switch (sortBy) {
          case 'price-low':
            result.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            result.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          default:
            break;
        }

        setProducts(result);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [query, selectedCategory, selectedVendor, minRating, sortBy, priceRange]);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next);
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    updateParams({ category: catId });
  };

  const handleVendorChange = (vendorId) => {
    setSelectedVendor(vendorId);
    updateParams({ vendor: vendorId });
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedVendor('');
    setMinRating(0);
    setPriceRange([0, 100000]);
    setSearchParams(query ? { q: query } : {});
  };

  const hasActiveFilters = selectedCategory || selectedVendor || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 100000;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
<<<<<<< Updated upstream
        <h1 className="text-3xl font-display font-bold text-surface-900">
          {query
            ? `Results for "${query}"`
            : selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name
              : 'All Products'}
=======
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
            {query ? 'Search Results' : 'Browse Products'}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-surface-900">
          {query ? `Results for "${query}"` : selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Products'}
>>>>>>> Stashed changes
        </h1>
        <p className="mt-2 text-surface-500">{products.length} products found</p>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5">
              {categories.find((c) => c.id === selectedCategory)?.name}
              <button onClick={() => handleCategoryChange('')} aria-label="Remove category filter"><X className="h-3 w-3" /></button>
            </span>
          )}
          {selectedVendor && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5">
              {vendors.find((v) => v.id === selectedVendor)?.storeName || selectedVendor}
              <button onClick={() => handleVendorChange('')} aria-label="Remove vendor filter"><X className="h-3 w-3" /></button>
            </span>
          )}
          {minRating > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5">
              <Star className="h-3 w-3 fill-current" /> {minRating}+
              <button onClick={() => setMinRating(0)} aria-label="Remove rating filter"><X className="h-3 w-3" /></button>
            </span>
          )}
          <button onClick={clearAllFilters} className="text-xs font-medium text-surface-500 hover:text-danger underline underline-offset-2">
            Clear all
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-surface-100">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary text-sm lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>

        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none input-field py-2.5 pr-10 text-sm w-auto cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" />
          </div>

          <div className="hidden sm:flex items-center rounded-xl border border-surface-200 bg-white/80 backdrop-blur-sm p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-2 transition-all duration-200 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-2 transition-all duration-200 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recently Viewed */}
      {recentProducts.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-surface-900 uppercase tracking-wide">Recently Viewed</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-white/95 backdrop-blur-xl p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0 lg:backdrop-blur-none' : 'hidden'} lg:block w-full lg:w-64 shrink-0`}>
          <div className="flex items-center justify-between lg:hidden mb-6">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="btn-ghost p-2">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Categories */}
            <div>
              <h4 className="text-sm font-semibold text-surface-900 mb-3">Category</h4>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                      selectedCategory === cat.id
                        ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                        : 'text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-1.5">
                <Store className="h-4 w-4 text-surface-400" /> Vendor
              </h4>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                <button
                  onClick={() => handleVendorChange('')}
                  className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors ${
                    !selectedVendor ? 'bg-primary-50 text-primary-700 font-medium' : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  All Vendors
                </button>
                {vendors.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleVendorChange(v.id)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors ${
                      selectedVendor === v.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    <span className="line-clamp-1">{v.storeName || v.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-surface-900 mb-3">Minimum Rating</h4>
              <div className="flex gap-2 flex-wrap">
                {[0, 3, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                      minRating === r
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    {r === 0 ? 'Any' : <><Star className="h-3 w-3 inline -mt-0.5 fill-current" /> {r}+</>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-surface-900 mb-3">Price Range</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                    className="input-field py-2 text-sm w-full"
                    placeholder="Min"
                  />
                  <span className="text-surface-300">—</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                    className="input-field py-2 text-sm w-full"
                    placeholder="Max"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-surface-400">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategory || priceRange[0] > 0 || priceRange[1] < 1000) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setPriceRange([0, 1000]);
                  setSearchParams({});
                }}
                className="w-full btn-ghost text-sm text-primary-600 hover:bg-primary-50"
              >
                Clear All Filters
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(false)}
            className="btn-primary w-full mt-6 lg:hidden"
          >
            Apply Filters
          </button>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="aspect-square skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-1/3 skeleton rounded-lg" />
                    <div className="h-4 w-3/4 skeleton rounded-lg" />
                    <div className="h-4 w-1/2 skeleton rounded-lg" />
                    <div className="flex items-center justify-between pt-3 border-t border-surface-100">
                      <div className="h-6 w-20 skeleton rounded-lg" />
                      <div className="flex gap-2">
                        <div className="h-8 w-8 skeleton rounded-xl" />
                        <div className="h-8 w-8 skeleton rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {products.map((product, index) => (
                <div key={product.id} style={{ animationDelay: `${index * 0.03}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-100 mx-auto mb-6">
                <Search className="h-10 w-10 text-surface-300" />
              </div>
              <p className="text-xl font-semibold text-surface-700">No products found</p>
              <p className="mt-2 text-surface-500 max-w-md mx-auto">Try adjusting your filters or search term to find what you're looking for.</p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setPriceRange([0, 1000]);
                  setSearchParams({});
                }}
                className="btn-primary mt-6"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
