import { useState } from 'react';
import { X, Link2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api/import-product';

export default function ImportProductModal({ show, onClose, vendorId, vendorName, onImported }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          vendorId,
          vendorName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import product');
      }

      setPreview(data.product);
      onImported?.(data.product);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUrl('');
    }
  };

  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-surface-900">Import Product from URL</h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-surface-500 mb-6">
          Enter a product URL from any e-commerce site. We'll extract the title, description, price, and images for your review before publishing.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Product URL</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/product/..."
                className="input-field pl-10"
                required
                disabled={loading}
              />
            </div>
            {url && !isValidUrl(url) && (
              <p className="mt-1 text-xs text-red-500">Please enter a valid HTTP(S) URL</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !url || !isValidUrl(url)}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Product'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>

        {preview && (
          <div className="mt-6 rounded-2xl border border-surface-200 bg-surface-50 p-6">
            <div className="flex items-start gap-4">
              {preview.images?.[0] && (
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-200">
                  <img src={preview.images[0]} alt={preview.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-surface-900">{preview.name}</h3>
                <p className="text-lg font-bold text-primary-600">${preview.price?.toFixed(2)}</p>
                <p className="mt-1 text-xs text-surface-500">Category: {preview.category}</p>
                {preview.description && (
                  <p className="mt-2 text-xs text-surface-600 line-clamp-2">{preview.description}</p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-surface-100 px-4 py-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-surface-600">
                  Product imported successfully! It has been saved as <strong>draft</strong> (inactive) in your store.
                  Go to <strong>My Products</strong> to edit and activate it for sale.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
