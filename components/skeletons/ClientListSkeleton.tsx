import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientListSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="w-48 h-8" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barra de Búsqueda Skeleton */}
            <div className="relative">
              <Skeleton className="w-full h-10 rounded-md" />
            </div>

            {/* Lista de Clientes Skeleton */}
            <div className="rounded-md border divide-y overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`client-skeleton-${i}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 sm:gap-0"
                >
                  {/* Left side: Avatar + Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="w-32 h-5" />
                      <Skeleton className="w-24 h-4" />
                    </div>
                  </div>

                  {/* Right side: Quick Action */}
                  <div className="flex items-center gap-2 sm:pl-4">
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Paginación Skeleton */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Skeleton className="w-32 h-4" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-24 h-9 rounded-md" />
                <Skeleton className="w-24 h-9 rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
