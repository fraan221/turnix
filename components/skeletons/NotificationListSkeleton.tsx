import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationListSkeleton() {
  const renderSection = (title: string, key: string) => (
    <div key={key}>
      <h2 className="px-4 py-2 text-lg font-semibold tracking-tight font-heading">
        <Skeleton className="w-32 h-7" />
      </h2>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 text-sm border-l-4 border-transparent bg-background"
          >
            <Skeleton className="w-4/5 h-5" />
            <Skeleton className="w-1/4 h-4 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="space-y-4">
        {renderSection("Esta semana", "week")}
        {renderSection("Este mes", "month")}
      </div>
    </div>
  );
}
