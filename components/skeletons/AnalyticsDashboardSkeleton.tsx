import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboardSkeleton() {
  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      {/* SECCIÓN 1: FACTURACIÓN */}
      <section className="space-y-4">
        <Card>
          <CardHeader className="flex items-center justify-between gap-2 sm:flex-row xs:flex-col">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-10 w-40" />
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={`billing-${i}`} />
          ))}
        </div>

        <Skeleton className="w-full h-[300px] rounded-xl" />
      </section>

      {/* SECCIÓN 2: CLIENTES */}
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-32" />
          </CardHeader>
        </Card>

        {/* ClientMetricsCards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={`client-metrics-${i}`} />
          ))}
        </div>

        {/* ClientInsightsPanel */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={`client-insights-${i}`} />
          ))}
        </div>

        {/* TopClientsTable */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="flex items-center pb-2 border-b">
                  <Skeleton className="h-4 w-6 mr-4" /> {/* # */}
                  <Skeleton className="h-4 w-32 flex-1" /> {/* Nombre */}
                  <Skeleton className="h-4 w-28 flex-1" /> {/* Teléfono */}
                  <Skeleton className="h-4 w-16 text-right mr-4" /> {/* Visitas */}
                  <Skeleton className="h-4 w-20 text-right" /> {/* Gastado */}
                </div>
                {/* Table Body (5 rows) */}
                <div className="space-y-4 pt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`client-row-${i}`} className="flex items-center pb-4 border-b last:border-0 last:pb-0">
                      <Skeleton className="h-4 w-6 mr-4" />
                      <div className="flex-1 flex items-center gap-2">
                        <Skeleton className="h-4 w-32" />
                        {i < 2 && <Skeleton className="h-5 w-12 rounded-full" />} {/* VIP badge mock */}
                      </div>
                      <Skeleton className="h-4 w-28 flex-1" />
                      <Skeleton className="h-4 w-16 text-right mr-4" />
                      <Skeleton className="h-4 w-20 text-right" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
