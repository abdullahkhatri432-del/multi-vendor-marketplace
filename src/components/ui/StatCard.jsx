export default function StatCard({ icon: Icon, label, value, change, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    accent: 'bg-purple-50 text-purple-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card group p-6">
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
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 ease-smooth group-hover:-rotate-6 group-hover:scale-110 ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <span className="mt-4 block h-1 w-full overflow-hidden rounded-full bg-surface-100">
        <span className={`block h-full w-2/3 rounded-full bg-gradient-to-r from-primary-500 to-accent transition-transform duration-700 ease-out group-hover:scale-x-125 origin-left`} />
      </span>
    </div>
  );
}
