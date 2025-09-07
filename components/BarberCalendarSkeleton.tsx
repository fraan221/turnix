import { Skeleton } from "@/components/ui/skeleton";

export default function BarberCalendarSkeleton() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="hidden w-10 h-10 md:block" />
          <Skeleton className="hidden w-10 h-10 md:block" />
          <Skeleton className="w-20 h-10" />
        </div>

        <Skeleton className="w-48 h-7" />

        <div className="flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <div className="p-4 bg-white border rounded-lg">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-8" />
          ))}
        </div>
        <Skeleton className="w-full h-[600px]" />
      </div>
    </div>
  );
}
