export default function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/5] skeleton rounded-none" />
      <div className="space-y-3 p-3 sm:p-4">
        <div className="h-3 w-1/3 skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-1/2 skeleton rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-16 skeleton rounded" />
          <div className="h-8 w-8 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 stagger sm:gap-5 lg:grid-cols-4 lg:gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 skeleton rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-32 skeleton rounded" />
            <div className="h-3 w-24 skeleton rounded" />
          </div>
        </div>
        <div className="space-y-2 text-right">
          <div className="h-5 w-16 skeleton rounded" />
          <div className="h-4 w-20 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

export function OrderSkeletonList({ count = 5 }) {
  return (
    <div className="space-y-4 stagger">
      {[...Array(count)].map((_, i) => (
        <OrderSkeleton key={i} />
      ))}
    </div>
  );
}

export function VendorSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 skeleton rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-40 skeleton rounded" />
            <div className="h-3 w-28 skeleton rounded" />
          </div>
        </div>
        <div className="h-8 w-20 skeleton rounded-full" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="card p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 skeleton rounded-2xl" />
        <div className="space-y-2">
          <div className="h-5 w-32 skeleton rounded" />
          <div className="h-3 w-20 skeleton rounded" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-14 skeleton rounded-xl" />
        <div className="h-14 skeleton rounded-xl" />
        <div className="h-14 skeleton rounded-xl" />
      </div>
    </div>
  );
}
