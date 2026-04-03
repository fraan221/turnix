import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamListSkeleton() {
  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>
          <Skeleton className="w-32 h-8" />
        </CardTitle>
        <Skeleton className="h-10 w-36" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative p-4 border rounded-lg bg-card"
            >
              {/* Owner Badge Skeleton (only for the first item) */}
              {i === 0 && (
                <div className="absolute top-3 right-3">
                  <Skeleton className="w-20 h-5 rounded-full" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <Skeleton className="w-14 h-14 rounded-full" />

                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="w-3/4 h-5" />
                  <div className="flex items-center gap-1.5 mt-1">
                    <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
                    <Skeleton className="w-1/2 h-4" />
                  </div>
                </div>
              </div>

              {/* Action Button Skeleton (for non-owner items) */}
              {i !== 0 && (
                <div className="pt-4 mt-4 border-t">
                  <Skeleton className="w-full h-9 rounded-md" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
