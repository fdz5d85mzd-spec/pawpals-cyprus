import { SkeletonBar, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <SkeletonBar className="h-3 w-28 mb-4" />
      <SkeletonBar className="h-9 w-2/3 mb-8" />
      <SkeletonCard className="h-24 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-16" />
      </div>
      <SkeletonCard className="h-48" />
    </div>
  );
}
