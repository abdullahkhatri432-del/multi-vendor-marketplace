import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { DollarSign, Package, ShoppingCart, TrendingUp, Plus, BarChart3, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProductsByVendor, getOrdersByVendor, getVendor } from '../config/firestore';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function VendorDashboard() {
  const { user, isVendor, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, ords, vend] = await Promise.all([
          getProductsByVendor(user.uid),
          getOrdersByVendor(user.uid),
          getVendor(user.uid),
        ]);
        setProducts(prods);
        setOrders(ords);
        setVendor(vend);
      } catch (err) {
        console.error('Failed to fetch vendor data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isVendor) return <Navigate to="/" />;
  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Vendor Dashboard</h1>
          <p className="mt-1 text-surface-500">Welcome back, {vendor?.storeName || user?.displayName}</p>
        </div>
        <Link to="/vendor/products" className="btn-primary">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} change={12} color="success" />
        <StatCard icon={Package} label="Products" value={products.length} color="primary" />
        <StatCard icon={ShoppingCart} label="Orders" value={orders.length} change={8} color="accent" />
        <StatCard icon={TrendingUp} label="Pending" value={pendingOrders} color="warning" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/vendor/products" className="card p-6 flex items-center gap-4 hover:border-primary-200 transition-all group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">Manage Products</p>
            <p className="text-xs text-surface-500">{products.length} products listed</p>
          </div>
        </Link>
        <Link to="/vendor/orders" className="card p-6 flex items-center gap-4 hover:border-primary-200 transition-all group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">View Orders</p>
            <p className="text-xs text-surface-500">{pendingOrders} pending fulfillment</p>
          </div>
        </Link>
        <Link to="/products" className="card p-6 flex items-center gap-4 hover:border-primary-200 transition-all group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">View Storefront</p>
            <p className="text-xs text-surface-500">See your public store</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-surface-900 mb-4">Recent Orders</h3>
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="pb-3 text-left font-medium text-surface-500">Order ID</th>
                  <th className="pb-3 text-left font-medium text-surface-500">Customer</th>
                  <th className="pb-3 text-left font-medium text-surface-500">Status</th>
                  <th className="pb-3 text-right font-medium text-surface-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-surface-50">
                    <td className="py-3 font-medium text-surface-900">#{order.id?.slice(0, 8)}</td>
                    <td className="py-3 text-surface-600">{order.customerName || 'Customer'}</td>
                    <td className="py-3">
                      <span className={`badge ${
                        order.status === 'delivered' ? 'badge-success' :
                        order.status === 'pending' ? 'badge-warning' : 'badge-primary'
                      }`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold">${order.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-surface-500 text-sm py-4">No orders yet. Products will appear here when customers purchase.</p>
        )}
      </div>
    </div>
  );
}
