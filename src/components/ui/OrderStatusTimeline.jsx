import { CheckCircle2, Circle, Package, Truck, Home, ShieldCheck } from 'lucide-react';

const STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'processing', label: 'Processing', icon: ShieldCheck },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

export default function OrderStatusTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm font-medium text-red-600">
        <Circle className="h-4 w-4" />
        Order Cancelled
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Order status">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx || currentIdx === -1;
        const active = i === currentIdx;
        const Icon = step.icon;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-1 sm:gap-2 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-100 text-surface-400'
                } ${active ? 'ring-4 ring-emerald-100' : ''}`}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  done ? 'text-surface-700' : 'text-surface-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 rounded ${done && i < currentIdx ? 'bg-emerald-400' : 'bg-surface-200'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
