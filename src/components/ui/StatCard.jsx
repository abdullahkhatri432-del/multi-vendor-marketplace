export default function StatCard({ icon: Icon, label, value, change, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    accent: 'bg-purple-50 text-purple-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-surface-900">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
