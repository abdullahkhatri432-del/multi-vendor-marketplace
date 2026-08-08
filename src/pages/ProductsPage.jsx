import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid3X3, LayoutList, X } from 'lucide-react';
import { getAllProducts, searchProducts } from '../config/firestore';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';

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
  }, [query, selectedCategory, sortBy, priceRange]);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    if (catId) {
      setSearchParams({ category: catId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-surface-900">
          {query ? `Results for "${query}"` : selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Products'}
        </h1>
        <p className="mt-2 text-surface-500">{products.length} products found</p>
      </div>

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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field py-2 text-sm w-auto"
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          <div className="hidden sm:flex items-center rounded-xl border border-surface-200 bg-white p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-surface-400'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-surface-400'}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0' : 'hidden'} lg:block w-full lg:w-64 shrink-0`}>
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
              <h4 className="text-sm font-semibold text-surface-900 mb-3">Price Range</h4>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                  className="input-field py-2 text-sm w-full"
                  placeholder="Min"
                />
                <span className="text-surface-400">—</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                  className="input-field py-2 text-sm w-full"
                  placeholder="Max"
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
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
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
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg font-medium text-surface-700">No products found</p>
              <p className="mt-2 text-surface-500">Try adjusting your filters or search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
