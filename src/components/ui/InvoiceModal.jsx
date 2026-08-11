import { X, Printer, Store } from 'lucide-react';

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const date = order.createdAt?.toDate?.()?.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label="Invoice">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-premium invoice-print">
        <div className="sticky top-0 flex items-center justify-between border-b border-surface-100 bg-white px-6 py-4">
          <h3 className="text-lg font-bold text-surface-900">Invoice</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="btn-secondary text-sm">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={onClose} className="btn-ghost p-2" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 border-b border-surface-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-display font-bold text-surface-900">Speedersmania</p>
                <p className="text-xs text-surface-500">Multi-Vendor Marketplace</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-surface-900">Invoice #{order.id?.slice(0, 12)}</p>
              <p className="text-xs text-surface-500">{date || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1">Billed To</p>
              <p className="text-sm font-semibold text-surface-900">{order.customerName}</p>
              <p className="text-sm text-surface-600">{order.customerEmail}</p>
              <p className="mt-2 text-sm text-surface-600">
                {order.shippingAddress?.address}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
                <br />
                {order.shippingAddress?.country}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1">Payment</p>
              <p className="text-sm text-surface-700">Method: {order.paymentMethod?.toUpperCase() || '—'}</p>
              <p className="text-sm text-surface-700">
                Status: <span className="capitalize">{order.paymentStatus?.replace(/-/g, ' ') || '—'}</span>
              </p>
              {order.paymentReference && (
                <p className="text-sm text-surface-700 font-mono">UTR: {order.paymentReference}</p>
              )}
              {order.couponCode && <p className="text-sm text-surface-700">Coupon: {order.couponCode}</p>}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-left text-xs font-semibold text-surface-500 uppercase">
                <th className="py-2">Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {order.items?.map((item, i) => (
                <tr key={i}>
                  <td className="py-3">
                    <p className="font-medium text-surface-900">{item.name}</p>
                    {item.addons?.length > 0 && (
                      <p className="text-xs text-surface-500">Add-ons: {item.addons.map((a) => a.title).join(', ')}</p>
                    )}
                  </td>
                  <td className="py-3 text-center text-surface-600">{item.quantity}</td>
                  <td className="py-3 text-right font-medium">
                    ₹{((item.price * item.quantity) + (item.addonTotal || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-surface-600">
              <span>Subtotal</span>
              <span>₹{(order.subtotal ?? 0).toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span>-₹{(order.discount ?? 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-surface-600">
              <span>Shipping</span>
              <span>{order.shipping ? `₹${order.shipping.toFixed(2)}` : 'Free'}</span>
            </div>
            <div className="flex justify-between text-surface-600">
              <span>Tax</span>
              <span>₹{(order.tax ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-surface-200 pt-2 text-base font-bold text-surface-900">
              <span>Total</span>
              <span>₹{(order.total ?? 0).toFixed(2)}</span>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-surface-400">
            Thank you for shopping at Speedersmania. This is a system-generated invoice.
          </p>
        </div>
      </div>
    </div>
  );
}
