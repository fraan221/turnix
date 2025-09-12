import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamListSkeleton() {
  return (
    <Card className="mx-auto max-w-7xl">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>
          <Skeleton className="w-32 h-8" />
        </CardTitle>
        <Skeleton className="h-10 w-36" />
      </CardHeader>
      <CardContent>
        <div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 mb-4 border rounded-lg border-gray-200/40 last:mb-0"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="w-40 h-4" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
