"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function FixedBookingsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Skeleton className="h-10 w-full sm:w-72" />
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-7 gap-4 p-4 bg-muted/50">
          <Skeleton className="h-5 w-32 col-span-2" />
          <Skeleton className="h-5 w-24 hidden md:block" />
          <Skeleton className="h-5 w-20 hidden md:block" />
          <Skeleton className="h-5 w-24 hidden lg:block" />
          <Skeleton className="h-5 w-20 hidden md:block" />
          <Skeleton className="h-5 w-16 ml-auto" />
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-7 gap-4 p-4 items-center">
              <div className="col-span-2 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="hidden md:block space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="hidden md:block">
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="hidden lg:block">
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="hidden md:block">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
