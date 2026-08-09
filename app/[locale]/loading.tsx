import { SkeletonBar, SkeletonCard } from "@/components/Skeleton";

// Generic fallback for any route under [locale] without its own more
// specific loading.tsx — Next.js wraps the segment in Suspense
// automatically, so this shows instantly on navigation instead of a blank
// page while the server component fetches data.
export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <SkeletonBar className="h-3 w-24 mb-4" />
      <SkeletonBar className="h-9 w-2/3 mb-8" />
      <div className="space-y-3">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
    </div>
  );
}
