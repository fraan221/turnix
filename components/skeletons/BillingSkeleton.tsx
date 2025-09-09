import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Card>
        <CardHeader className="items-center text-center">
          <CardTitle>
            <Skeleton className="w-64 h-6" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 mt-2 w-36" />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Skeleton className="w-48 h-10 rounded-lg" />
        </CardContent>
      </Card>
      <Skeleton className="w-full h-48 max-w-md" />
      <Skeleton className="w-48 h-12" />
    </div>
  );
}
