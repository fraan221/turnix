import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClientDetailLoading() {
  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="grid gap-2">
            <Skeleton className="h-8 w-[250px] md:w-[300px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <Button disabled className="gap-2 w-[140px] shrink-0">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="w-20 h-5" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="w-16 h-6" />
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                <Skeleton className="w-full h-4 mt-2 max-w-[400px]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid w-full gap-2">
                <Skeleton className="w-full h-[150px] rounded-md" />
                <Skeleton className="w-full h-10 mt-2 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="w-32 h-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={`skeleton-upcoming-${i}`} className="flex justify-between">
                    <div className="space-y-2">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-32 h-3" />
                    </div>
                    <Skeleton className="w-20 h-5 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="w-24 h-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={`skeleton-history-${i}`} className="flex justify-between">
                    <div className="space-y-2">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-28 h-3" />
                    </div>
                    <Skeleton className="w-20 h-5 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
