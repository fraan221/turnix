import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsFormSkeleton() {
  return (
    <div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            <Skeleton className="w-3/4 h-8" />
          </CardTitle>
          <CardDescription className="sr-only">
            <Skeleton className="w-full h-4" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center mx-auto space-y-4 max-w-7xl">
            {/* Avatar and file input skeleton */}
            <div className="flex items-center w-full gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="grid w-full items-center gap-1.5">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-10" />
              </div>
            </div>

            {/* Input skeletons */}
            <div className="grid w-full gap-2">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-full h-10" />
            </div>
            <div className="grid w-full gap-2">
              <Skeleton className="w-40 h-4" />
              <Skeleton className="w-full h-10" />
            </div>
            <div className="grid w-full gap-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="w-full h-10" />
            </div>
            <div className="grid w-full gap-2">
              <Skeleton className="w-48 h-4" />
              <Skeleton className="w-full h-10" />
            </div>

            {/* Button skeleton */}
            <Skeleton className="w-full h-10 mt-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
