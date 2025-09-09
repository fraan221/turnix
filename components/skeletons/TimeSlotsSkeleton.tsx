import { Skeleton } from "@/components/ui/skeleton";

export default function TimeSlotsSkeleton() {
  return (
    <div className="grid w-full grid-cols-3 gap-2 pr-2 sm:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="w-full h-10" />
      ))}
    </div>
  );
}
