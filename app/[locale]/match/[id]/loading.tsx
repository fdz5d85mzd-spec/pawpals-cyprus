import { SkeletonBar, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-6 pb-16">
      <SkeletonBar className="h-4 w-16 mb-6" />
      <SkeletonCard className="h-28 mb-6" />
      <SkeletonCard className="h-16 mb-6" />
      <SkeletonCard className="h-40 mb-6" />
      <SkeletonCard className="h-32" />
    </div>
  );
}
