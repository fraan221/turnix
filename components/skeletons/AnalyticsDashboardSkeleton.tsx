import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsDashboardSkeleton() {
  return (
    <>
      <div className="max-w-6xl mx-auto space-y-2">
        <div className="flex flex-row items-center justify-between space-x-4">
          <div className="space-y-2">
            <Skeleton className="w-48 h-7" />
            <Skeleton className="w-64 h-4" />
          </div>
          <div>
            <Skeleton className="w-48 h-12" />
          </div>
        </div>
        <div className="space-y-6">
          {/* Esqueleto para las tarjetas de estadísticas */}
          <div className="grid max-w-4xl grid-cols-1 gap-4 mx-auto md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <Skeleton className="w-24 h-5" />
                  <Skeleton className="h-6 w-7" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="w-32 h-8" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Esqueleto para el gráfico principal */}
          <Card className="max-w-4xl mx-auto">
            <CardContent>
              <Skeleton className="w-full h-[350px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
