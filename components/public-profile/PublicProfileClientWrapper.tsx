"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingWizardSkeleton } from "@/components/skeletons/BookingWizardSkeleton";

function ProfileSkeleton() {
  return (
    <div className="space-y-8 w-full max-w-4xl">
      <Card>
        <CardHeader className="flex flex-col justify-center items-center p-6 space-y-4 text-center bg-card">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="w-48 h-8" />
        </CardHeader>
      </Card>
      <BookingWizardSkeleton />
    </div>
  );
}

const PublicProfileClientWrapper = dynamic(
  () => import("./PublicProfileClient").then((mod) => mod.PublicProfileClient),
  {
    ssr: false,
    loading: () => <ProfileSkeleton />,
  }
);

export default PublicProfileClientWrapper;
