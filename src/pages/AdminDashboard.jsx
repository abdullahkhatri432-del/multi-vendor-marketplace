import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Users, Store, Package, ShoppingCart, DollarSign, Shield,
  CheckCircle, XCircle, BarChart3, Trash2, Edit2, Eye,
  Search, Calendar, ChevronDown, TrendingUp, AlertTriangle,
  Tag, Plus, X, RefreshCw, Clock, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getPlatformStats, getAllVendors, getAllOrders, getAllProducts,
  getAllUsers, updateUserRole, deleteUser, updateOrderStatus,
  deleteOrder, deleteProductById, updateVendor, getAllCategories,
  createCategory, deleteCategory,
} from '../config/firestore';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export default function AdminDashboard() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });

  const fetchAllData = async () => {
    try {
      const [statsData, vendorsData, ordersData, productsData, usersData, catsData] = await Promise.all([
        getPlatformStats(),
        getAllVendors(),
        getAllOrders(),
        getAllProducts(),
        getAllUsers(),
        getAllCategories(),
      ]);
      setStats(statsData);
      setVendors(vendorsData);
      setOrders(ordersData);
      setProducts(productsData);
      setUsers(usersData);
      setCategories(catsData);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchAllData();
      setLoading(false);
    };
    load();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleVerifyVendor = async (vendorId, verified) => {
    try {
      await updateVendor(vendorId, { verified: !verified });
      setVendors(vendors.map((v) => (v.id === vendorId ? { ...v, verified: !verified } : v)));
    } catch (err) { console.error('Failed to update vendor:', err); }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!confirm('Delete this vendor? This cannot be undone.')) return;
    try {
      await updateVendor(vendorId, { deleted: true });
      setVendors(vendors.filter((v) => v.id !== vendorId));
    } catch (err) { console.error('Failed to delete vendor:', err); }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) { console.error('Failed to update role:', err); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) { console.error('Failed to delete user:', err); }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err) { console.error('Failed to update order:', err); }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Delete this order?')) return;
    try {
      await deleteOrder(orderId);
      setOrders(orders.filter((o) => o.id !== orderId));
    } catch (err) { console.error('Failed to delete order:', err); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProductById(productId);
      setProducts(products.filter((p) => p.id !== productId));
    } catch (err) { console.error('Failed to delete product:', err); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      const id = await createCategory(newCategory);
      setCategories([...categories, { id, ...newCategory }]);
        setNewCategory({ name: '', icon: '' });
      setShowCategoryForm(false);
    } catch (err) { console.error('Failed to add category:', err); }
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteCategory(catId);
      setCategories(categories.filter((c) => c.id !== catId));
    } catch (err) { console.error('Failed to delete category:', err); }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
  ];

  const statusColors = {
    pending: 'badge-warning', processing: 'badge-primary',
    shipped: 'badge-primary', delivered: 'badge-success', cancelled: 'badge-danger',
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return o.id?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredProducts = products.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredUsers = users.filter((u) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Admin Dashboard</h1>
          <p className="mt-1 text-surface-500">Platform management & analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} className={`btn-secondary text-sm ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-2">
            <Shield className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">Admin</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-2xl bg-surface-100 p-1 overflow-x-auto scrollbar-hide">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setSearchQuery(''); setStatusFilter('all'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === id ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Search Bar (for tabs that need it) */}
      {['orders', 'products', 'users'].includes(activeTab) && (
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="input-field pl-10 py-2.5 text-sm"
            />
          </div>
          {activeTab === 'orders' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field py-2.5 text-sm w-auto"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="primary" />
            <StatCard icon={Store} label="Vendors" value={stats?.totalVendors || 0} color="accent" />
            <StatCard icon={Package} label="Products" value={stats?.totalProducts || 0} color="primary" />
            <StatCard icon={ShoppingCart} label="Orders" value={stats?.totalOrders || 0} color="success" />
            <StatCard icon={DollarSign} label="Revenue" value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`} color="success" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <h4 className="text-sm font-semibold text-surface-900">Pending Orders</h4>
              </div>
              <p className="text-3xl font-bold text-surface-900">{orders.filter((o) => o.status === 'pending').length}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <h4 className="text-sm font-semibold text-surface-900">Pending Vendors</h4>
              </div>
              <p className="text-3xl font-bold text-surface-900">{vendors.filter((v) => !v.verified).length}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Star className="h-5 w-5 text-emerald-600" />
                </div>
                <h4 className="text-sm font-semibold text-surface-900">Avg Order Value</h4>
              </div>
              <p className="text-3xl font-bold text-surface-900">
                ${orders.length > 0 ? (orders.reduce((s, o) => s + (o.total || 0), 0) / orders.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Recent Orders</h3>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100">
                      <th className="pb-3 text-left font-medium text-surface-500">Order</th>
                      <th className="pb-3 text-left font-medium text-surface-500">Customer</th>
                      <th className="pb-3 text-left font-medium text-surface-500">Date</th>
                      <th className="pb-3 text-left font-medium text-surface-500">Status</th>
                      <th className="pb-3 text-right font-medium text-surface-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {orders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="hover:bg-surface-50">
                        <td className="py-3 font-medium text-surface-900">#{order.id?.slice(0, 8)}</td>
                        <td className="py-3 text-surface-600">{order.customerName || 'N/A'}</td>
                        <td className="py-3 text-surface-500">{order.createdAt?.toDate?.().toLocaleDateString() || '—'}</td>
                        <td className="py-3"><span className={`badge ${statusColors[order.status] || 'badge-primary'}`}>{order.status || 'pending'}</span></td>
                        <td className="py-3 text-right font-semibold">${order.total?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-surface-500 text-sm py-4">No orders yet.</p>
            )}
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {filteredUsers.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 bg-surface-50">
                      <th className="px-6 py-3 text-left font-medium text-surface-500">User</th>
                      <th className="px-6 py-3 text-left font-medium text-surface-500">Role</th>
                      <th className="px-6 py-3 text-left font-medium text-surface-500">Joined</th>
                      <th className="px-6 py-3 text-right font-medium text-surface-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xs font-bold">
                              {u.displayName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-surface-900">{u.displayName || 'No name'}</p>
                              <p className="text-xs text-surface-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={u.role || 'customer'}
                            onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-100"
                          >
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-surface-500">
                          {u.createdAt?.toDate?.().toLocaleDateString() || '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="btn-ghost p-2 text-red-500 hover:bg-red-50"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState icon={Users} title="No users found" description="Users will appear here when they register." />
          )}
        </div>
      )}

      {/* VENDORS TAB */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {vendors.length > 0 ? vendors.map((vendor) => (
            <div key={vendor.id} className="card p-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                    <Store className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{vendor.storeName}</p>
                    <p className="text-xs text-surface-500">{vendor.totalSales || 0} sales &middot; {vendor.totalProducts || 0} products &middot; {vendor.rating?.toFixed(1) || '0.0'} rating</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {vendor.verified ? (
                    <span className="badge-success">Verified</span>
                  ) : (
                    <span className="badge-warning">Pending</span>
                  )}
                  <button
                    onClick={() => handleVerifyVendor(vendor.id, vendor.verified)}
                    className={`btn-ghost p-2 ${vendor.verified ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                    title={vendor.verified ? 'Revoke' : 'Verify'}
                  >
                    {vendor.verified ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteVendor(vendor.id)}
                    className="btn-ghost p-2 text-red-500 hover:bg-red-50"
                    title="Delete vendor"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <EmptyState icon={Store} title="No vendors yet" description="Vendors will appear here when users register as sellers." />
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {filteredOrders.length > 0 ? filteredOrders.map((order) => (
            <div key={order.id} className="card overflow-hidden animate-fade-in">
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100">
                    <ShoppingCart className="h-6 w-6 text-surface-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">Order #{order.id?.slice(0, 8)}</p>
                    <p className="text-xs text-surface-500">{order.customerName} &middot; {order.createdAt?.toDate?.().toLocaleDateString() || 'Processing'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${statusColors[order.status] || 'badge-primary'}`}>{order.status || 'pending'}</span>
                  <span className="text-lg font-bold text-surface-900">${order.total?.toFixed(2) || '0.00'}</span>
                  <ChevronDown className={`h-5 w-5 text-surface-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandedOrder === order.id && (
                <div className="border-t border-surface-100 px-6 py-4 bg-surface-50 animate-slide-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm rounded-lg bg-white px-3 py-2">
                            <span className="text-surface-600">{item.name} x{item.quantity}</span>
                            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-surface-100 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-surface-500">Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-surface-500">Shipping</span><span>${order.shipping?.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-surface-500">Tax</span><span>${order.tax?.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold pt-1 border-t border-surface-100"><span>Total</span><span>${order.total?.toFixed(2)}</span></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 mb-2">Shipping Address</h4>
                      <p className="text-sm text-surface-600 bg-white rounded-lg px-3 py-2">
                        {order.shippingAddress?.address}<br />
                        {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}<br />
                        {order.shippingAddress?.country}
                      </p>
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-surface-900 mb-2">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleOrderStatus(order.id, status)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                order.status === status
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-300'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="mt-4 flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" /> Delete Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <EmptyState icon={ShoppingCart} title="No orders found" description="Orders will appear when customers make purchases." />
          )}
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.length > 0 ? filteredProducts.map((product) => (
            <div key={product.id} className="card overflow-hidden animate-fade-in">
              <div className="aspect-video overflow-hidden bg-surface-100">
                <img src={product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/300/200`} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-surface-900 truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-surface-500">{product.vendorName}</span>
                  <span className="text-xs text-surface-300">&middot;</span>
                  <span className="text-xs text-surface-500">{product.category}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-primary-600">${product.price?.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <span className={`badge ${product.active ? 'badge-success' : 'badge-warning'}`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Product
                </button>
              </div>
            </div>
          )) : (
            <p className="text-center text-surface-500 py-8 col-span-full">No products found.</p>
          )}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-500">{categories.length} categories</p>
            <button onClick={() => setShowCategoryForm(true)} className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Add Category
            </button>
          </div>

          {showCategoryForm && (
            <div className="card p-6 animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">New Category</h3>
                <button onClick={() => setShowCategoryForm(false)} className="btn-ghost p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddCategory} className="flex gap-3">
                <input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Category name"
                  className="input-field flex-1"
                  required
                />
                <input
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  placeholder="Emoji icon"
                  className="input-field w-24"
                />
                <button type="submit" className="btn-primary">Add</button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="card p-4 text-center relative group">
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 btn-ghost p-1 text-red-500 hover:bg-red-50 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <span className="text-3xl">{cat.icon || '📦'}</span>
                <p className="mt-2 text-sm font-semibold text-surface-700">{cat.name}</p>
                <p className="text-xs text-surface-400 mt-0.5">{products.filter((p) => p.category === cat.id).length} products</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
