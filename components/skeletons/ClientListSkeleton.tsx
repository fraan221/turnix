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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg border-gray-200/40"
              >
                <div className="space-y-2">
                  <Skeleton className="w-32 h-5" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="w-20 h-9" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
