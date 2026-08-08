import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Users, Store, Package, ShoppingCart, DollarSign, TrendingUp, Shield, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPlatformStats, getAllVendors, getAllOrders, getAllProducts, updateVendor } from '../config/firestore';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function AdminDashboard() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, vendorsData, ordersData, productsData] = await Promise.all([
          getPlatformStats(),
          getAllVendors(),
          getAllOrders(),
          getAllProducts(),
        ]);
        setStats(statsData);
        setVendors(vendorsData);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVerifyVendor = async (vendorId, verified) => {
    try {
      await updateVendor(vendorId, { verified: !verified });
      setVendors(vendors.map((v) => (v.id === vendorId ? { ...v, verified: !verified } : v)));
    } catch (err) {
      console.error('Failed to update vendor:', err);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Admin Dashboard</h1>
          <p className="mt-1 text-surface-500">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-2">
          <Shield className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-semibold text-primary-700">Admin</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 rounded-2xl bg-surface-100 p-1 overflow-x-auto scrollbar-hide">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === id ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={Users} label="Users" value={stats?.totalUsers || 0} color="primary" />
            <StatCard icon={Store} label="Vendors" value={stats?.totalVendors || 0} color="accent" />
            <StatCard icon={Package} label="Products" value={stats?.totalProducts || 0} color="primary" />
            <StatCard icon={ShoppingCart} label="Orders" value={stats?.totalOrders || 0} color="success" />
            <StatCard icon={DollarSign} label="Revenue" value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`} color="success" />
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Recent Orders</h3>
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
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="hover:bg-surface-50">
                      <td className="py-3 font-medium text-surface-900">#{order.id?.slice(0, 8)}</td>
                      <td className="py-3 text-surface-600">{order.customerName || 'N/A'}</td>
                      <td className="py-3">
                        <span className={`badge ${
                          order.status === 'delivered' ? 'badge-success' :
                          order.status === 'pending' ? 'badge-warning' : 'badge-primary'
                        }`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold">${order.total?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {vendors.length > 0 ? vendors.map((vendor) => (
            <div key={vendor.id} className="card p-6 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                  <Store className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{vendor.storeName}</p>
                  <p className="text-xs text-surface-500">{vendor.totalSales || 0} sales &middot; {vendor.totalProducts || 0} products</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {vendor.verified ? (
                  <span className="badge-success">Verified</span>
                ) : (
                  <span className="badge-warning">Pending</span>
                )}
                <button
                  onClick={() => handleVerifyVendor(vendor.id, vendor.verified)}
                  className={`btn-ghost p-2 ${vendor.verified ? 'text-red-500' : 'text-emerald-500'}`}
                  title={vendor.verified ? 'Revoke verification' : 'Verify vendor'}
                >
                  {vendor.verified ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )) : (
            <p className="text-center text-surface-500 py-8">No vendors registered yet.</p>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length > 0 ? orders.map((order) => (
            <div key={order.id} className="card p-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-surface-900">Order #{order.id?.slice(0, 8)}</p>
                  <p className="text-xs text-surface-500 mt-1">
                    {order.customerName} &middot; {order.createdAt?.toDate?.().toLocaleDateString() || 'Processing'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    order.status === 'delivered' ? 'badge-success' :
                    order.status === 'pending' ? 'badge-warning' : 'badge-primary'
                  }`}>
                    {order.status || 'pending'}
                  </span>
                  <span className="text-lg font-bold">${order.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-surface-500 py-8">No orders placed yet.</p>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.length > 0 ? products.map((product) => (
            <div key={product.id} className="card p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-100">
                  <img src={product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/48/48`} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-surface-900 truncate">{product.name}</p>
                  <p className="text-xs text-surface-500">{product.category} &middot; ${product.price?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-surface-500 py-8 col-span-full">No products listed yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
