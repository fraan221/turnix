import { Skeleton } from "@/components/ui/skeleton";

export default function BarberCalendarSkeleton() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="hidden w-10 h-10 md:block" />
          <Skeleton className="hidden w-10 h-10 md:block" />
          <Skeleton className="w-16 h-10" />
        </div>

        <Skeleton className="w-48 h-8" />

        <div className="flex justify-end">
          <Skeleton className="h-10 w-14" />
        </div>
      </div>

      <Skeleton className="w-full h-[600px]" />
    </div>
  );
}
