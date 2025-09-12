import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingWizardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="w-3/4 h-7" />
        <Skeleton className="w-full h-4 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="w-6 h-6 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-4/5 h-4" />
                <Skeleton className="w-2/5 h-4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-end w-full">
          <Skeleton className="h-10 w-28" />
        </div>
      </CardFooter>
    </Card>
  );
}
