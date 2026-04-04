import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ServiceListSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="w-full max-w-6xl mx-auto border-2">
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">
            <Skeleton className="w-48 h-8" />
          </CardTitle>
          <Skeleton className="w-full sm:w-36 h-11 rounded-md" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="w-32 h-5" />
                </div>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div
                    key={j}
                    className="relative flex flex-col p-4 border-2 rounded-xl bg-card h-[120px]"
                  >
                    <div className="flex-1 space-y-3">
                      <Skeleton className="w-2/3 h-6" />
                      <div className="space-y-1.5">
                        <Skeleton className="w-full h-4" />
                        <Skeleton className="w-5/6 h-4" />
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <Skeleton className="w-16 h-5" />
                        <Skeleton className="w-20 h-5" />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Skeleton className="w-9 h-9 rounded-md" />
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
