export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface2 ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`card p-5 animate-pulse ${className}`} />;
}
