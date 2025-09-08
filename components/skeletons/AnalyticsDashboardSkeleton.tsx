import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Esqueleto para las tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Skeleton className="w-24 h-5" />
              <Skeleton className="w-6 h-6" />
            </CardHeader>
            <CardContent>
              <Skeleton className="w-32 h-8" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Esqueleto para el gráfico principal */}
      <Card>
        <CardHeader>
          <Skeleton className="w-48 h-7" />
          <Skeleton className="w-64 h-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[350px]" />
        </CardContent>
      </Card>
    </div>
  );
}
