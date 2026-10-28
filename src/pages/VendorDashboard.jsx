import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  DollarSign, Package, ShoppingCart, TrendingUp, Plus, BarChart3, ClipboardList,
  AlertTriangle, CheckCircle, Clock, Star, Edit2, PackageOpen,
  ExternalLink, Image as ImageIcon, Type, Tag, DollarSign as DollarIcon,
  FileText, Upload, ArrowUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getProductsByVendor, getOrdersByVendor, getVendor, getVendorAnalytics,
} from '../config/firestore';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProductImporter from '../components/ProductImporter';
import BulkImport from '../components/BulkImport';
import DraftProducts from '../components/DraftProducts';

export default function VendorDashboard() {
  const { user, isVendor, isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, bulk-import, drafts

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, ords, vend, analyticsData] = await Promise.all([
          getProductsByVendor(user.uid),
          getOrdersByVendor(user.uid),
          getVendor(user.uid),
          getVendorAnalytics(user.uid),
        ]);
        setProducts(prods);
        setOrders(ords);
        setVendor(vend);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Failed to fetch vendor data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (authLoading) return <LoadingSpinner size="lg" className="py-32" />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isVendor) return <Navigate to="/" />;
  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock < 10);
  const outOfStockProducts = products.filter((p) => p.stock === 0);
  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5);

  const vendorItems = (order) => (order.items || []).filter((it) => it.vendorId === user.uid);
  const vendorSubtotal = (order) =>
    vendorItems(order).reduce((s, it) => s + (it.price || 0) * (it.quantity || 1) + (it.addonTotal || 0), 0);

  const statusColors = {
    pending: 'badge-warning', processing: 'badge-primary',
    shipped: 'badge-primary', delivered: 'badge-success', cancelled: 'badge-danger',
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'bulk-import', label: 'Bulk Import', icon: Upload },
    { id: 'drafts', label: 'Drafts', icon: FileText },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Vendor Dashboard</h1>
          <p className="mt-1 text-surface-500">Welcome back, {vendor?.storeName || user?.displayName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/vendor/products" className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      {vendor && !vendor.verified && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Your store is under review</p>
            <p className="mt-1 text-amber-700">
              An admin has not verified your store yet. You can still add products and prepare your
              catalog — once approved, your store will be featured on the marketplace.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <nav className="flex gap-2 border-b border-surface-200" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={DollarSign} label="Revenue" value={`₹${analytics?.totalRevenue?.toFixed(2) || '0.00'}`} color="success" />
            <StatCard icon={ShoppingCart} label="Orders" value={analytics?.totalOrders || 0} color="primary" />
            <StatCard icon={Package} label="Products" value={products.length} color="accent" />
            <StatCard icon={Clock} label="Pending" value={analytics?.pendingOrders || 0} color="warning" />
          </div>

          {/* Low Stock Alert */}
          {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-900">Inventory Alerts</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {outOfStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2 text-sm">
                    <span className="text-surface-700">{p.name}</span>
                    <span className="badge-danger">Out of Stock</span>
                  </div>
                ))}
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-2 text-sm">
                    <span className="text-surface-700">{p.name}</span>
                    <span className="badge-warning">{p.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-surface-900">Recent Orders</h3>
                  <Link to="/vendor/orders" className="btn-ghost text-sm">View All</Link>
                </div>
                {orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-100">
                          <th className="pb-3 text-left font-medium text-surface-500">Order</th>
                          <th className="pb-3 text-left font-medium text-surface-500">Customer</th>
                          <th className="pb-3 text-left font-medium text-surface-500">Status</th>
                          <th className="pb-3 text-right font-medium text-surface-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-50">
                        {orders.slice(0, 7).map((order) => (
                          <tr key={order.id} className="hover:bg-surface-50">
                            <td className="py-3 font-medium text-surface-900">#{order.id?.slice(0, 8)}</td>
                            <td className="py-3 text-surface-600">{order.customerName || 'Customer'}</td>
                            <td className="py-3">
                              <span className={`badge ${statusColors[order.status] || 'badge-primary'}`}>{order.status || 'pending'}</span>
                            </td>
                            <td className="py-3 text-right font-semibold">₹{vendorSubtotal(order).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PackageOpen className="h-10 w-10 text-surface-300 mx-auto mb-3" />
                    <p className="text-sm text-surface-500">No orders yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Top Products */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-surface-900 mb-4">Top Selling Products</h3>
                {topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {topProducts.map((product, i) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-surface-900 truncate">{product.name}</p>
                          <p className="text-xs text-surface-400">{product.soldCount || 0} sold</p>
                        </div>
                        <span className="text-xs font-semibold text-surface-700">₹{product.price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-surface-500">No sales data yet</p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-surface-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">Completed Orders</span>
                    <span className="text-xs font-semibold text-surface-900">{analytics?.completedOrders || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">Active Products</span>
                    <span className="text-xs font-semibold text-surface-900">{products.filter((p) => p.active).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">Out of Stock</span>
                    <span className="text-xs font-semibold text-red-600">{outOfStockProducts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">Store Rating</span>
                    <span className="text-xs font-semibold text-surface-900 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {vendor?.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-surface-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link to="/vendor/products" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                    <Plus className="h-4 w-4 text-primary-500" /> Add Product
                  </Link>
                  <Link to="/vendor/orders" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                    <ClipboardList className="h-4 w-4 text-primary-500" /> Manage Orders
                  </Link>
                  <Link to="/products" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                    <BarChart3 className="h-4 w-4 text-primary-500" /> View Marketplace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'bulk-import' && (
        <div>
          <BulkImport onImportComplete={() => setActiveTab('drafts')} />
        </div>
      )}

      {activeTab === 'drafts' && (
        <div>
          <DraftProducts />
        </div>
      )}
    </div>
  );
}