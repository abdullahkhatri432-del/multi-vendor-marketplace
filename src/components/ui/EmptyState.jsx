export default function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center anim-rise">
      <div className="relative mb-6">
        <span className="absolute inset-0 rounded-3xl bg-primary-100/60 breathe" aria-hidden />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-100">
          {Icon && <Icon className="h-10 w-10 text-surface-300" />}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-surface-500">{description}</p>
      {action && actionLabel && (
        <button onClick={action} className="btn-primary mt-6">{actionLabel}</button>
      )}
    </div>
  );
}
