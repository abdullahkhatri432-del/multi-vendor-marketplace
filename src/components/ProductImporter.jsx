import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Type,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProductImporter({ onProductImported }) {
  const { user, isAuthenticated, isVendor } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImport = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!url.trim()) {
      setError('Please enter a product URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com/product)');
      return;
    }

    if (!isAuthenticated) {
      setError('Please sign in to import products');
      return;
    }
    if (!isVendor) {
      setError('Only vendors can import products');
      return;
    }

    setLoading(true);

    try {
      const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || '/api/import-product';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          vendorId: user.uid,
          vendorName: user.displayName || 'Vendor',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import product');
      }

      setResult(data.product);
      addToast('Product imported successfully!', 'success');
      onProductImported?.(data.product);
    } catch (err) {
      setError(err.message || 'Failed to import product. Please try again.');
      addToast(err.message || 'Import failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setResult(null);
  };

  const handleViewProduct = () => {
    if (result?.id) {
      navigate(`/vendor/products/${result.id}/edit`);
    }
  };

  const handleImportAnother = () => {
    setUrl('');
    setResult(null);
    setError('');
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-surface-900">Import Product from URL</h2>
          <p className="text-sm text-surface-500 mt-1">
            Paste any e-commerce product URL and we'll extract the details automatically
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
          <Globe className="h-3.5 w-3.5" />
          Auto-Scrape
        </span>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={handleRetry} className="ml-auto text-sm font-medium hover:underline">
            Try Again
          </button>
        </div>
      )}

      {result ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-900">Product Imported Successfully</p>
              <p className="text-sm text-emerald-700">{result.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleViewProduct} className="btn-primary text-sm">
                Edit Product
              </button>
              <button onClick={handleImportAnother} className="btn-secondary text-sm">
                Import Another
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Image Preview */}
            {result.images?.length > 0 && (
              <div className="rounded-xl border border-surface-200 overflow-hidden bg-surface-50">
                <img
                  src={result.images[0]}
                  alt={result.name}
                  className="w-full h-48 object-cover"
                />
                {result.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    +{result.images.length - 1} more
                  </div>
                )}
              </div>
            )}

            {/* Product Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Type className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Title</p>
                  <p className="font-medium text-surface-900 line-clamp-1">{result.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Price</p>
                  <p className="font-bold text-surface-900">${Number(result.price).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Category</p>
                  <p className="font-medium text-surface-900 capitalize">{result.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Images Found</p>
                  <p className="font-medium text-surface-900">{result.images?.length || 0} images</p>
                </div>
              </div>
            </div>

            {/* Description Preview */}
            {result.description && (
              <div className="md:col-span-2 p-3 rounded-xl bg-surface-50">
                <p className="text-xs text-surface-500 mb-1">Description</p>
                <p className="text-sm text-surface-700 line-clamp-3">{result.description}</p>
              </div>
            )}

            {/* Source URL */}
            <div className="md:col-span-2 p-3 rounded-xl bg-surface-50">
              <p className="text-xs text-surface-500 mb-1">Imported From</p>
              <a
                href={result.importedFrom}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary-600 hover:underline break-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {result.importedFrom}
              </a>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleImport} className="space-y-4">
          <div className="relative">
            <label htmlFor="product-url" className="sr-only">
              Product URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
              <input
                id="product-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/product-page"
                className="input-field pl-10 pr-10"
                disabled={loading}
                required
              />
              {url && !loading && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                  aria-label="Clear URL"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <ExternalLink className="h-5 w-5 mr-2" />
                Import Product
              </>
            )}
          </button>

          <p className="text-center text-xs text-surface-400">
            Supports most e-commerce sites (Amazon, Shopify stores, etc.) via OpenGraph & schema.org metadata
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-surface-100">
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <ImageIcon className="h-4 w-4" />
              <span>Images</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <DollarSign className="h-4 w-4" />
              <span>Price</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <Type className="h-4 w-4" />
              <span>Description</span>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}