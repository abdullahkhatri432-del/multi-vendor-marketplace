import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Star, BadgeCheck, ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones, Sparkles } from 'lucide-react';
import { getVerifiedVendors } from '../config/firestore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const result = await getVerifiedVendors();
        setVendors(result);
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-2">
          <Store className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Marketplace</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-surface-900">All Verified Vendors</h1>
        <p className="mt-3 text-surface-500 max-w-xl mx-auto">
          Shop directly from trusted, background-checked sellers across electronics, fashion, home and more.
        </p>
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No vendors yet"
          description="Vendors will appear here as stores get approved on the platform."
          action={() => {}}
          actionLabel="Browse Products"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor, index) => (
            <Link
              key={vendor.id}
              to={`/vendor/${vendor.id}`}
              className="group card bg-white/80 backdrop-blur-sm border border-surface-100 hover:border-primary-200 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-accent/20 group-hover:scale-110 transition-transform duration-300">
                    {vendor.logo ? (
                      <img src={vendor.logo} alt={vendor.storeName} className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
                    ) : (
                      <Store className="h-6 w-6 text-primary-600" />
                    )}
                    {vendor.verified && (
                      <div className="absolute -top-1 -right-1">
                        <BadgeCheck className="h-5 w-5 text-primary-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {vendor.storeName}
                    </h2>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {vendor.totalProducts || 0} products · {vendor.totalSales || 0} sales
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-surface-800">{vendor.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs text-surface-400">rating</span>
                  </div>
                  {vendor.verified && (
                    <span className="badge-success ml-auto">Verified</span>
                  )}
                </div>

                <div className="rounded-xl bg-surface-50 border border-surface-100 px-4 py-3">
                  <span className="w-full rounded-xl bg-primary-100/80 px-3 py-1.5 text-center text-xs font-medium text-primary-700 inline-flex items-center justify-center gap-1.5 transition-all group-hover:bg-primary-600 group-hover:text-white">
                    Visit Store <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Trust Badges */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: ShieldCheck, label: 'Verified Sellers', desc: 'Background checked' },
          { icon: Truck, label: 'Fast Delivery', desc: '2-5 business days' },
          { icon: RotateCcw, label: 'Easy Returns', desc: '30-day hassle-free' },
          { icon: Headphones, label: '24/7 Support', desc: 'Dedicated help' },
        ].map(({ icon: Icon, label, desc }, index) => (
          <div key={label} className="card p-5 text-center hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mx-auto mb-3">
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-surface-900">{label}</p>
            <p className="text-xs text-surface-500 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
