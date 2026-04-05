import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationListSkeleton() {
  const renderSection = (title: string, key: string) => (
    <div key={key} className="space-y-3">
      <div className="sticky top-0 z-10 py-2 bg-background/95 backdrop-blur px-4 md:px-0">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          <Skeleton className="w-24 h-5" />
        </h2>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 text-sm border-l-4 border-transparent bg-muted/30 rounded-r-lg"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="w-4 h-4 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-4/5 h-4" />
                <Skeleton className="w-1/4 h-3 mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="w-48 h-9" />
          <Skeleton className="w-96 h-5 mt-2 max-w-[80vw]" />
        </div>
        <Skeleton className="w-40 h-8 rounded-md" />
      </div>

      <div className="pb-6 space-y-8">
        {renderSection("Esta semana", "week")}
        {renderSection("Este mes", "month")}
      </div>
    </div>
  );
}
