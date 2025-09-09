import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimeBlockListSkeleton() {
  return (
    <Card className="mx-auto max-w-7xl">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>
          <Skeleton className="w-48 h-8" />
        </CardTitle>
        <Skeleton className="h-10 w-36" />
      </CardHeader>
      <CardContent>
        <div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="space-y-2">
                <Skeleton className="w-40 h-5" />
                <Skeleton className="w-56 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
