interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-elevated/60 animate-pulse rounded-lg ${className}`} />
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 ${className}`}>
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-8 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function SkeletonRow({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-7 w-12" />
      </div>
    </div>
  )
}
