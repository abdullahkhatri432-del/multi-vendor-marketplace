import { useState, useCallback } from 'react';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2,
  Eye,
  Edit,
  Check,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Percent,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT?.replace('/import-product', '/bulk-import') || '/api/bulk-import';

export default function BulkImport({ onImportComplete }) {
  const { user, isVendor, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  
  const [urls, setUrls] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ successful: [], failed: [] });
  const [showResults, setShowResults] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      addToast('Please sign in to import products', 'error');
      return;
    }
    if (!isVendor) {
      addToast('Only vendors can import products', 'error');
      return;
    }

    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urlList.length === 0) {
      addToast('Please enter at least one URL', 'error');
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: urlList.length });
    setResults({ successful: [], failed: [] });
    setShowResults(false);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: urlList,
          vendorId: user.uid,
          vendorName: user.displayName || 'Vendor',
          markupPercentage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bulk import failed');
      }

      setResults({
        successful: data.products || [],
        failed: data.errors || []
      });
      setShowResults(true);
      
      const successCount = data.summary?.successful || 0;
      const failCount = data.summary?.failed || 0;
      
      if (successCount > 0) {
        addToast(`Successfully imported ${successCount} product${successCount > 1 ? 's' : ''}`, 'success');
      }
      if (failCount > 0) {
        addToast(`${failCount} URL${failCount > 1 ? 's' : ''} failed to import`, 'warning');
      }
      
      onImportComplete?.(data);
    } catch (err) {
      addToast(err.message || 'Bulk import failed', 'error');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleClear = () => {
    setUrls('');
    setResults({ successful: [], failed: [] });
    setShowResults(false);
  };

  const urlCount = urls.split('\n').filter(u => u.trim().length > 0).length;

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-surface-900">Bulk Product Import</h2>
          <p className="text-sm text-surface-500 mt-1">
            Paste multiple product URLs (one per line) for wholesaler batch import with auto-pricing
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
          <Percent className="h-3.5 w-3.5" />
          Auto-Markup: {markupPercentage}%
        </span>
      </div>

      {urls && !loading && (
        <div className="mb-4 p-3 bg-surface-50 rounded-xl border border-surface-200">
          <p className="text-sm text-surface-600">
            <strong>{urlCount}</strong> URL{urlCount !== 1 ? 's' : ''} ready to import
            {markupPercentage > 0 && (
              <> with <strong>{markupPercentage}%</strong> markup applied </>)}
          </p>
        </div>
      )}

      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label htmlFor="bulk-urls" className="block text-sm font-medium text-surface-700 mb-1.5">
            Product URLs <span className="text-primary-500">*</span>
          </label>
          <textarea
            id="bulk-urls"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://example.com/product-1
https://example.com/product-2
https://example.com/product-3"
            className="input-field min-h-[150px] font-mono text-sm"
            rows={6}
            disabled={loading}
            required
          />
          <p className="mt-1.5 text-xs text-surface-400">
            Enter one URL per line. Supports most e-commerce sites via OpenGraph & schema.org metadata.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="markup" className="text-sm font-medium text-surface-700">Markup %</label>
            <input
              id="markup"
              type="number"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
              min={0}
              max={100}
              className="input-field w-24 text-center"
            />
            <span className="text-sm text-surface-500">Default: 20%</span>
          </div>

          <button
            type="submit"
            disabled={loading || !urls.trim()}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Bulk Import
              </>
            )}
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-600">Processing...</span>
              <span className="font-mono text-primary-600">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </form>

      {showResults && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-surface-900">Import Results</h3>
            <button
              onClick={handleClear}
              className="btn-ghost text-sm"
            >
              <X className="h-4 w-4" /> Clear
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-900">
                  Successful: {results.successful.length}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {results.successful.map((item, i) => (
                  <div key={item.productId || i} className="text-sm text-emerald-800 flex items-center gap-2">
                    <span className="w-6 text-center">{i + 1}.</span>
                    <span className="truncate">{item.product?.name || 'Unnamed Product'}</span>
                    <span className="ml-auto font-mono">${item.product?.price?.toFixed(2)}</span>
                  </div>
                ))}
                {results.successful.length === 0 && (
                  <p className="text-sm text-emerald-600">No successful imports</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-900">
                  Failed: {results.failed.length}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {results.failed.map((item, i) => (
                  <div key={i} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="w-6 text-center">{i + 1}.</span>
                    <span className="truncate font-mono">{item.url}</span>
                    <span className="ml-auto text-xs text-red-600">{item.error}</span>
                  </div>
                ))}
                {results.failed.length === 0 && (
                  <p className="text-sm text-red-600">No failed imports</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-surface-200">
            <button
              onClick={handleClear}
              className="btn-secondary flex-1"
            >
              Import More
            </button>
            <button
              onClick={() => window.location.href = '/vendor/products?tab=drafts'}
              className="btn-primary flex-1"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Review Drafts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}