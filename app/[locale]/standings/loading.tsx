import { SkeletonBar, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
      <SkeletonBar className="h-3 w-20 mb-4" />
      <SkeletonBar className="h-9 w-1/2 mb-8" />
      <SkeletonCard className="h-80" />
    </div>
  );
}
