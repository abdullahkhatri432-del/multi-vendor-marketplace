import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ClipboardList, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrdersByVendor, updateOrder } from '../config/firestore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export default function VendorOrders() {
  const { user, isVendor, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await getOrdersByVendor(user.uid);
        setOrders(result);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrder(orderId, { status });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };

  const statusColors = {
    pending: 'badge-warning',
    processing: 'badge-primary',
    shipped: 'badge-primary',
    delivered: 'badge-success',
    cancelled: 'badge-danger',
  };

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isVendor) return <Navigate to="/" />;
  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-surface-900">Vendor Orders</h1>
        <p className="mt-1 text-surface-500">Manage and fulfill customer orders</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden animate-fade-in">
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100">
                    <Package className="h-6 w-6 text-surface-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">Order #{order.id?.slice(0, 8)}</p>
                    <p className="text-xs text-surface-500">{order.customerName} &middot; {order.createdAt?.toDate?.().toLocaleDateString() || 'Processing'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`badge ${statusColors[order.status] || 'badge-primary'}`}>
                    {order.status || 'pending'}
                  </span>
                  <span className="text-lg font-bold text-surface-900">${order.total?.toFixed(2)}</span>
                  {expandedOrder === order.id ? <ChevronUp className="h-5 w-5 text-surface-400" /> : <ChevronDown className="h-5 w-5 text-surface-400" />}
                </div>
              </button>

              {expandedOrder === order.id && (
                <div className="border-t border-surface-100 px-6 py-4 bg-surface-50 animate-slide-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-surface-600">{item.name} x{item.quantity}</span>
                            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 mb-2">Shipping Address</h4>
                      <p className="text-sm text-surface-600">
                        {order.shippingAddress?.address}<br />
                        {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
                      </p>
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-surface-900 mb-2">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(order.id, status)}
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Orders from customers will appear here for fulfillment."
        />
      )}
    </div>
  );
}
