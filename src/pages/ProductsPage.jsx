import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid3X3, LayoutList, X, Star, Store, Clock } from 'lucide-react';
import { getAllProducts, searchProducts, getAllVendors, getProduct } from '../config/firestore';
import ProductCard from '../components/ui/ProductCard';
import SkeletonWrapper from '../components/ui/SkeletonWrapper';
import { trackEvent } from '../config/analytics';
import { inr } from '../utils/currency';

const RECENT_KEY = 'speedersmania_recently_viewed';
const SORT_OPTIONS = ['newest', 'price-low', 'price-high', 'rating'];

// Categories are stored as human labels ("Home & Living") but links use short
// slugs ("home"). Normalise both sides so every category link actually filters.
const normalizeCategory = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const categoryMatches = (productCategory, selectedCategory) => {
  const slug = normalizeCategory(productCategory);
  const wanted = normalizeCategory(selectedCategory);
  if (!wanted) return true;
  return slug === wanted || slug.startsWith(`${wanted}-`);
};

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedVendor, setSelectedVendor] = useState(searchParams.get('vendor') || '');
  const [vendors, setVendors] = useState([]);
  const [minRating, setMinRating] = useState(0);
  // `null` upper bound means "no maximum", so no product is hidden by default.
  const [priceRange, setPriceRange] = useState([0, null]);
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
    if (!Array.isArray(ids) || ids.length === 0 || query) {
      setRecentProducts([]);
      return undefined;
    }
    let cancelled = false;
    Promise.all(
      ids
        .slice(0, 4)
        .map((id) => getProduct(id).catch(() => null))
    ).then((items) => {
      if (!cancelled) setRecentProducts(items.filter(Boolean));
    });
    return () => { cancelled = true; };
  }, [query]);

  // Keep filters in sync with the URL. Without this, links like
  // /products?category=fashion or /products?sort=price-low do nothing when the
  // user is already on the products page (the component stays mounted).
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const vendor = searchParams.get('vendor') || '';
    const sort = searchParams.get('sort') || 'newest';
    const min = Math.max(0, Number(searchParams.get('min')) || 0);
    const maxParam = searchParams.get('max');
    const parsedMax = maxParam === null || maxParam === '' ? null : Number(maxParam);
    const max = Number.isFinite(parsedMax) ? Math.max(0, parsedMax) : null;

    setSelectedCategory((prev) => (prev === category ? prev : category));
    setSelectedVendor((prev) => (prev === vendor ? prev : vendor));
    if (SORT_OPTIONS.includes(sort)) {
      setSortBy((prev) => (prev === sort ? prev : sort));
    }
    setPriceRange((prev) =>
      prev[0] === min && prev[1] === max ? prev : [min, max]
    );
  }, [searchParams]);

  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'home', name: 'Home & Living' },
    { id: 'sports', name: 'Sports' },
    { id: 'beauty', name: 'Beauty' },
    { id: 'books', name: 'Books' },
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

  // Read the catalogue once per search query; filters and sorting are applied
  // locally so typing in a price box never triggers another Firestore read.
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const result = query
          ? await searchProducts(query)
          : await getAllProducts(100);
        if (!cancelled) setAllProducts(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        if (!cancelled) setAllProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const products = useMemo(() => {
    const filtered = allProducts.filter((p) => {
      if (selectedCategory && !categoryMatches(p.category, selectedCategory)) return false;
      if (selectedVendor && p.vendorId !== selectedVendor) return false;
      if (minRating > 0 && (Number(p.rating) || 0) < minRating) return false;
      const price = Number(p.price) || 0;
      if (price < priceRange[0]) return false;
      if (priceRange[1] != null && price > priceRange[1]) return false;
      return true;
    });

    switch (sortBy) {
      case 'price-low':
        return [...filtered].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price-high':
        return [...filtered].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'rating':
        return [...filtered].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      default:
        return filtered;
    }
  }, [allProducts, selectedCategory, selectedVendor, minRating, sortBy, priceRange]);

  const updateParams = (updates) => {
    // Functional update so two changes fired in the same tick (price blur +
    // sort change) merge instead of overwriting each other's params.
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    });
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    updateParams({ category: catId });
  };

  const handleVendorChange = (vendorId) => {
    setSelectedVendor(vendorId);
    updateParams({ vendor: vendorId });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    updateParams({ sort: value === 'newest' ? '' : value });
  };

  // Persist the price bounds when the field loses focus. Keeping them in the
  // URL means changing sort/category later cannot silently drop the filter.
  const commitPriceRange = () => {
    updateParams({
      min: priceRange[0] > 0 ? String(priceRange[0]) : '',
      max: priceRange[1] != null ? String(priceRange[1]) : '',
    });
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedVendor('');
    setMinRating(0);
    setPriceRange([0, null]);
    setSearchParams(query ? { q: query } : {});
  };

  const hasActiveFilters =
    selectedCategory || selectedVendor || minRating > 0 || priceRange[0] > 0 || priceRange[1] != null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 reveal">
        <h1 className="text-fluid-title font-display font-bold text-surface-900">
          {query
            ? `Results for "${query}"`
            : selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name || selectedCategory
              : 'All Products'}
        </h1>
        <p className="mt-2 text-surface-500">{products.length} products found</p>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 anim-rise">
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5">
              {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
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
          {(priceRange[0] > 0 || priceRange[1] != null) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5">
              {priceRange[1] == null
                ? `${inr(priceRange[0])}+`
                : priceRange[0] > 0
                  ? `${inr(priceRange[0])} – ${inr(priceRange[1])}`
                  : `Under ${inr(priceRange[1])}`}
              <button
                onClick={() => {
                  setPriceRange([0, null]);
                  updateParams({ min: '', max: '' });
                }}
                aria-label="Remove price filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button onClick={clearAllFilters} className="text-xs font-medium text-surface-500 hover:text-danger underline underline-offset-2">
            Clear all
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-surface-100 pb-4 reveal">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary text-sm lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            aria-label="Sort products"
            className="input-field w-auto min-w-0 max-w-[15rem] py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          <div className="hidden sm:flex items-center rounded-xl border border-surface-200 bg-white p-1">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`rounded-lg p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-surface-400 hover:text-primary-600'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              title="List view"
              aria-pressed={viewMode === 'list'}
              className={`rounded-lg p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-surface-400 hover:text-primary-600'}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recently Viewed */}
      {recentProducts.length > 0 && (
        <section className="mb-10 reveal">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-surface-900 uppercase tracking-wide">Recently Viewed</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 stagger sm:grid-cols-4 sm:gap-4">
            {recentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto anim-rise shadow-premium lg:animate-none lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0 lg:shadow-none' : 'hidden'} lg:block w-full lg:w-64 shrink-0`}>
          <div className="flex items-center justify-between lg:hidden mb-6">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="btn-ghost p-2">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-surface-900 mb-3">Category</h4>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

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
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={priceRange[0] ?? ''}
                  onChange={(e) => setPriceRange([e.target.value === '' ? 0 : +e.target.value, priceRange[1]])}
                  onBlur={commitPriceRange}
                  className="input-field py-2 text-sm w-full"
                  placeholder="Min"
                  aria-label="Minimum price"
                />
                <span className="text-surface-400">—</span>
                <input
                  type="number"
                  min="0"
                  value={priceRange[1] ?? ''}
                  onChange={(e) => setPriceRange([priceRange[0], e.target.value === '' ? null : +e.target.value])}
                  onBlur={commitPriceRange}
                  className="input-field py-2 text-sm w-full"
                  placeholder="Max"
                  aria-label="Maximum price"
                />
              </div>
            </div>
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
          <SkeletonWrapper
            isLoading={loading}
            skeleton={
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 xl:gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="aspect-[4/5] skeleton rounded-none" />
                    <div className="space-y-3 p-3 sm:p-4">
                      <div className="h-3 w-1/3 skeleton rounded" />
                      <div className="h-4 w-3/4 skeleton rounded" />
                      <div className="h-4 w-1/2 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            {products.length > 0 ? (
              <div className={`grid gap-3 stagger sm:gap-5 lg:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} view={viewMode} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 anim-rise">
                <p className="text-lg font-medium text-surface-700">No products found</p>
                <p className="mt-2 text-surface-500">Try adjusting your filters or search term</p>
              </div>
            )}
          </SkeletonWrapper>
        </div>
      </div>
    </div>
  );
}
