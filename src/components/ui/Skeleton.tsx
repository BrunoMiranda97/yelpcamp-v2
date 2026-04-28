import { cn } from "../../lib/utils.ts";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", className)} />
  );
}

export function CampgroundCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center mt-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
