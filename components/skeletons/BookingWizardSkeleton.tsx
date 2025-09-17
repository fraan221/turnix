import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BookingWizardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="w-full h-12" />
      </CardHeader>
      <CardContent>
        <div>
          <Skeleton className="w-full rounded-md h-80" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Skeleton className="w-32 h-11" />
      </CardFooter>
    </Card>
  );
}
