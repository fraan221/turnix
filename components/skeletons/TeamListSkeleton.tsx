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
        <div className="divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="w-40 h-4" />
                </div>
              </div>
              <Skeleton className="h-9 w-9" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
