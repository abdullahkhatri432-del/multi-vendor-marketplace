import { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Calendar, FileText, MapPin, CreditCard, RotateCcw, ChevronDown, Store, Truck, ShieldCheck, CircleDollarSign } from 'lucide-react';
=======
import { Link, Navigate } from 'react-router-dom';
import { Package, Calendar, ChevronRight, ShoppingBag, Sparkles } from 'lucide-react';
>>>>>>> Stashed changes
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getOrdersByUser } from '../config/firestore';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import OrderStatusTimeline from '../components/ui/OrderStatusTimeline';
import InvoiceModal from '../components/ui/InvoiceModal';

export default function OrdersPage() {
<<<<<<< Updated upstream
  const { user } = useAuth();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
=======
  const { user, isAuthenticated } = useAuth();
>>>>>>> Stashed changes
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [reordering, setReordering] = useState(null);

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
    pending: 'bg-amber-50 text-amber-700 ring-amber-200/50',
    processing: 'bg-primary-50 text-primary-700 ring-primary-200/50',
    shipped: 'bg-blue-50 text-blue-700 ring-blue-200/50',
    delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200/50',
    cancelled: 'bg-red-50 text-red-700 ring-red-200/50',
  };

<<<<<<< Updated upstream
  const paymentColor = (s) => {
    if (s === 'verified' || s === 'paid' || s === 'completed') return 'badge-success';
    if (s === 'pending-verification' || s === 'advance-paid' || (s && s.startsWith('pending'))) return 'badge-warning';
    return 'badge-primary';
  };

  const paymentLabel = (s) => {
    if (!s) return 'Payment pending';
    return s.replace(/-/g, ' ');
  };

  const handleReorder = async (order) => {
    if (!order.items?.length) return;
    setReordering(order.id);
    try {
      order.items.forEach((item) => {
        addItem(
          {
            id: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            vendorId: item.vendorId,
            vendorName: item.vendorName,
          },
          item.quantity,
          item.addons || []
        );
      });
      addToast(`Added ${order.items.length} item${order.items.length > 1 ? 's' : ''} to cart`, 'success');
      navigate('/cart');
    } catch (err) {
      addToast('Could not reorder — try again', 'error');
    } finally {
      setReordering(null);
    }
  };

  const formatDate = (ts) => ts?.toDate?.().toLocaleString() || 'Processing';

  const getPaymentDisplay = (order) => {
    const method = order.paymentMethod;
    if (method === 'card') {
      return {
        label: `Card ending ${order.paymentDetails?.cardLast4 || '••••'}`,
        icon: CreditCard,
      };
    }
    if (method === 'upi') {
      return {
        label: `UPI ${order.paymentDetails?.upiId || 'reference'}`,
        icon: CircleDollarSign,
      };
    }
    if (method === 'cod') {
      return {
        label: `COD · Advance ₹${order.advanceAmount || 0} · Balance ₹${order.balanceDue || order.total || 0}`,
        icon: CircleDollarSign,
      };
    }
    return { label: method ? method.replace(/-/g, ' ') : 'Payment method', icon: CreditCard };
  };

=======
  if (!isAuthenticated) return <Navigate to="/login" />;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      <h1 className="text-3xl font-display font-bold text-surface-900 mb-2">My Orders</h1>
      <p className="text-sm text-surface-500 mb-8">Track, download invoices and reorder past purchases</p>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedId === order.id;
          const payment = getPaymentDisplay(order);
          return (
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
                      {formatDate(order.createdAt)}
=======
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Order History</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-surface-900">My Orders</h1>
        <p className="mt-1 text-surface-500">{orders.length} orders placed</p>
      </div>

      <div className="space-y-4">
        {orders.map((order, index) => (
          <div key={order.id} className="card p-6 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-accent/20">
                  <Package className="h-6 w-6 text-primary-600" />
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
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusColors[order.status] || statusColors.pending}`}>
                  {order.status || 'pending'}
                </span>
                <span className="text-xl font-bold text-surface-900">₹{order.total?.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-surface-100">
              <div className="flex flex-wrap gap-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-50 border border-surface-100 px-3 py-2">
                    <img
                      src={item.image || `https://picsum.photos/seed/${item.productId}/40/40`}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-xs font-medium text-surface-700 line-clamp-1">{item.name}</p>
                      <p className="text-2xs text-surface-400">Qty: {item.quantity}</p>
                      {item.addons && item.addons.length > 0 && (
                        <div className="text-2xs text-primary-600 mt-0.5">
                          Add-ons: {item.addons.map(a => a.title).join(', ')}
                        </div>
                      )}
>>>>>>> Stashed changes
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`badge ${paymentColor(order.paymentStatus)}`}>
                    {paymentLabel(order.paymentStatus)}
                  </span>
                  <span className={statusColors[order.status] || 'badge-primary'}>
                    {order.status || 'pending'}
                  </span>
                  <span className="text-lg font-bold text-surface-900">₹{order.total?.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5">
                <OrderStatusTimeline status={order.status} />
              </div>

              <div className="mt-5 pt-4 border-t border-surface-100">
                <div className="flex flex-wrap items-start gap-3">
                  {order.items?.map((item, i) => (
                    <Link
                      key={i}
                      to={`/products/${item.productId}`}
                      className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 hover:bg-surface-100 transition-colors"
                    >
                      <img
                        src={item.image || `https://picsum.photos/seed/${item.productId}/40/40`}
                        alt=""
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-xs font-medium text-surface-700">{item.name}</p>
                        <p className="text-xs text-surface-400">Qty: {item.quantity} × ₹{item.price}</p>
                        {item.addons && item.addons.length > 0 && (
                          <div className="text-[10px] text-primary-600 mt-0.5">
                            Add-ons: {item.addons.map(a => a.title).join(', ')}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Payment & shipping summary */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-surface-50 px-3.5 py-2.5 text-xs text-surface-600">
                  <payment.icon className="h-4 w-4 text-primary-600 shrink-0" />
                  <span className="line-clamp-1">{payment.label}</span>
                </div>
                {order.shippingAddress?.city ? (
                  <div className="flex items-center gap-2.5 rounded-xl bg-surface-50 px-3.5 py-2.5 text-xs text-surface-600">
                    <MapPin className="h-4 w-4 text-primary-600 shrink-0" />
                    <span className="line-clamp-1">
                      {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-xl bg-surface-50 px-3.5 py-2.5 text-xs text-surface-400">
                    <Truck className="h-4 w-4 shrink-0" /> No shipping address
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-100">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="btn-ghost text-sm"
                >
                  {isExpanded ? 'Hide details' : 'View details'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setInvoiceOrder(order)}
                    className="btn-secondary text-sm"
                    disabled={order.status === 'cancelled'}
                  >
                    <FileText className="h-4 w-4" /> Invoice
                  </button>
                  <button
                    onClick={() => handleReorder(order)}
                    disabled={reordering === order.id || order.status === 'cancelled'}
                    className="btn-primary text-sm"
                  >
                    <RotateCcw className={`h-4 w-4 ${reordering === order.id ? 'animate-spin' : ''}`} />
                    {reordering === order.id ? 'Adding...' : 'Reorder'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div>
                    <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary-600" /> Shipping Details
                    </h4>
                    {order.shippingAddress ? (
                      <div className="text-sm text-surface-600 space-y-1">
                        <p className="font-medium text-surface-800">{order.customerName}</p>
                        <p>{order.shippingAddress.address}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                        <p>{order.shippingAddress.country}</p>
                        {order.customerEmail && <p className="text-surface-400">{order.customerEmail}</p>}
                      </div>
                    ) : (
                      <p className="text-sm text-surface-400">No shipping address on record</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-primary-600" /> Payment Details
                    </h4>
                    <div className="text-sm text-surface-600 space-y-1.5">
                      <p className="flex items-center gap-1.5"><payment.icon className="h-4 w-4 text-surface-400" /> {payment.label}</p>
                      {order.paymentReference && (
                        <p className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-surface-400" /> Reference: {order.paymentReference}
                        </p>
                      )}
                      <p>Status: <span className="font-medium capitalize">{paymentLabel(order.paymentStatus)}</span></p>
                      {order.advanceAmount > 0 && <p>Advance paid: ₹{order.advanceAmount.toFixed(2)}</p>}
                      {order.balanceDue > 0 && <p>Balance due: ₹{order.balanceDue.toFixed(2)}</p>}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-primary-600" /> Sellers
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {order.items?.reduce((acc, item) => {
                        if (item.vendorId && !acc.some((x) => x.id === item.vendorId)) {
                          acc.push({ id: item.vendorId, name: item.vendorName || item.vendorId });
                        }
                        return acc;
                      }, []).map((v) => (
                        <Link
                          key={v.id}
                          to={`/vendor/${v.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 transition-colors"
                        >
                          <Store className="h-3.5 w-3.5 text-primary-600" />
                          {v.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-surface-900 mb-3">Order Summary</h4>
                    <div className="rounded-2xl bg-surface-50 p-4 text-sm space-y-2 text-surface-600">
                      <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal?.toFixed(2)}</span></div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Coupon {order.couponCode ? `(${order.couponCode})` : ''}</span>
                          <span>-₹{order.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between"><span>Shipping</span><span>{order.shipping > 0 ? `₹${order.shipping.toFixed(2)}` : 'Free'}</span></div>
                      <div className="flex justify-between"><span>GST (18%)</span><span>₹{order.tax?.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-surface-900 border-t border-surface-200 pt-2">
                        <span>Total</span><span>₹{order.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
}
