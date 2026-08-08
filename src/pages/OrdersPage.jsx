import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrdersByUser } from '../config/firestore';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await getOrdersByUser(user.uid);
        setOrders(result);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const statusColors = {
    pending: 'badge-warning',
    processing: 'badge-primary',
    shipped: 'badge-primary',
    delivered: 'badge-success',
    cancelled: 'badge-danger',
  };

  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place orders, they will appear here. Start shopping to see your order history."
          action={() => {}}
          actionLabel="Browse Products"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-surface-900 mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card p-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100">
                  <Package className="h-6 w-6 text-surface-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">Order #{order.id?.slice(0, 8)}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-surface-500">
                    <Calendar className="h-3 w-3" />
                    {order.createdAt?.toDate?.().toLocaleDateString() || 'Processing'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={statusColors[order.status] || 'badge-primary'}>
                  {order.status || 'pending'}
                </span>
                <span className="text-lg font-bold text-surface-900">${order.total?.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-surface-100">
              <div className="flex flex-wrap gap-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2">
                    <img
                      src={item.image || `https://picsum.photos/seed/${item.productId}/40/40`}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-xs font-medium text-surface-700">{item.name}</p>
                      <p className="text-xs text-surface-400">Qty: {item.quantity}</p>
                      {item.addons && item.addons.length > 0 && (
                        <div className="text-[10px] text-primary-600 mt-0.5">
                          Add-ons: {item.addons.map(a => a.title).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
