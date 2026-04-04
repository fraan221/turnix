import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function TimeBlockListSkeleton() {
  return (
    <div className="px-4 pb-6 mx-auto space-y-8 w-full max-w-6xl sm:px-6">
      <section>
        <Card className="border-2">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col p-4 space-y-4 rounded-xl border-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <Skeleton className="w-10 h-6 rounded-full" />
                      <Skeleton className="w-24 h-6" />
                    </div>
                    {/* Randomly closed days */}
                    {i === 0 || i === 6 ? (
                      <Skeleton className="w-16 h-6 rounded-md" />
                    ) : null}
                  </div>
                  {i !== 0 && i !== 6 && (
                    <div className="flex-grow pl-1 space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Skeleton className="w-20 h-5" />
                        </div>
                        <div className="flex flex-col gap-2 items-center sm:flex-row">
                          <Skeleton className="w-full h-10 rounded-md" />
                          <span className="flex-shrink-0 text-sm font-medium text-muted-foreground hidden sm:block">
                            —
                          </span>
                          <Skeleton className="w-full h-10 rounded-md" />
                        </div>
                      </div>
                      <div className="pt-2 mt-auto">
                        <Separator className="mb-4" />
                        <Skeleton className="w-full h-9 rounded-md" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center mt-6">
          <Skeleton className="w-full h-11 rounded-md sm:w-[280px]" />
        </div>
      </section>

      <Separator />

      <section>
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="flex gap-2 items-center text-xl sm:text-2xl">
                  <Skeleton className="w-6 h-6 rounded-md" />
                  <Skeleton className="w-48 h-6" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="w-64 h-4" />
                </CardDescription>
              </div>
              <Skeleton className="w-full sm:w-36 h-11 rounded-md" />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex flex-col justify-between gap-4 p-4 border rounded-lg sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      <Skeleton className="w-4 h-4 mt-0.5 shrink-0" />
                      <Skeleton className="w-32 h-5" />
                    </div>
                    <div className="flex flex-col gap-1.5 ml-6">
                      <Skeleton className="w-48 h-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Skeleton className="w-full sm:w-20 h-9 rounded-md" />
                    <Skeleton className="w-full sm:w-20 h-9 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}