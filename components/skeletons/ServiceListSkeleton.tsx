import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ServiceListSkeleton() {
  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>
            <Skeleton className="w-48 h-8" />
          </CardTitle>
          <Skeleton className="w-32 h-10" />
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold">
                  <Skeleton className="w-32 h-7" />
                </h3>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="space-y-2">
                      <Skeleton className="w-40 h-5" />
                      <Skeleton className="w-56 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
