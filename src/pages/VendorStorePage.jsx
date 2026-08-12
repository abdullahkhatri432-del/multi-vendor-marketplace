import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Star, BadgeCheck, ArrowLeft, Package, Shield, Truck, Headphones, RotateCcw } from 'lucide-react';
import { getVendor, getProductsByVendor } from '../config/firestore';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export default function VendorStorePage() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const [vendorData, vendorProducts] = await Promise.all([
          getVendor(vendorId),
          getProductsByVendor(vendorId),
        ]);
        if (!vendorData) {
          setNotFound(true);
        } else {
          setVendor(vendorData);
          setProducts(vendorProducts.filter((p) => p.active));
        }
      } catch (err) {
        console.error('Failed to fetch vendor store:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (vendorId) fetchStore();
  }, [vendorId]);

  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  if (notFound || !vendor) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={Store}
          title="Store not found"
          description="This vendor store doesn't exist or may have been removed."
          action={() => {}}
          actionLabel="Browse Marketplace"
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Store Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-accent">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary-500 blur-[120px]" />
          <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-accent blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <Link to="/vendors" className="inline-flex items-center gap-1.5 text-sm text-primary-200 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> All Vendors
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
              {vendor.logo ? (
                <img
                  src={vendor.logo}
                  alt={vendor.storeName}
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <Store className="h-10 w-10 text-primary-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">{vendor.storeName}</h1>
                {vendor.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified Vendor
                  </span>
                )}
              </div>
              {vendor.description && (
                <p className="mt-3 text-primary-200/80 max-w-2xl leading-relaxed">{vendor.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-primary-200">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-white">{vendor.rating?.toFixed(1) || '0.0'}</span> rating
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  <span className="font-semibold text-white">{products.length}</span> products
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span className="font-semibold text-white">{vendor.totalSales || 0}</span> sales
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-surface-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'Verified Seller', desc: 'Background checked' },
              { icon: Truck, label: 'Fast Delivery', desc: '2-5 business days' },
              { icon: RotateCcw, label: 'Easy Returns', desc: '30-day hassle-free' },
              { icon: Headphones, label: 'Seller Support', desc: 'Direct vendor help' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{label}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-surface-900">Products from {vendor.storeName}</h2>
            <p className="mt-1 text-sm text-surface-500">Browse the full catalog sold by this verified store</p>
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="This vendor hasn't published any products yet. Check back soon."
            action={() => {}}
            actionLabel="Browse Marketplace"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
