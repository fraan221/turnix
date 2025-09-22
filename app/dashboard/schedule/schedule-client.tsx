"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { TimeBlock, Role } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import ScheduleForm from "@/components/ScheduleForm";
import TimeBlockList from "@/components/TimeBlockList";
import { ReadOnlyScheduleView } from "@/components/schedule/ReadOnlyScheduleView";
import { WorkingHoursWithBlocks } from "./page";

const AddTimeBlockModalContent = dynamic(
  () =>
    import("@/components/AddTimeBlockModal").then(
      (mod) => mod.AddTimeBlockModalContent
    ),
  { ssr: false }
);

const ModalContentSkeleton = () => (
  <>
    <DialogHeader>
      <DialogTitle>
        <Skeleton className="w-48 h-6" />
      </DialogTitle>
      <DialogDescription>
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-10/12 h-4 mt-1" />
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-full h-10" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-full h-10" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-full h-10" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-full h-10" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
    </div>
    <DialogFooter className="pt-4">
      <Skeleton className="w-24 h-10" />
      <Skeleton className="w-[160px] h-10" />
    </DialogFooter>
  </>
);

interface ScheduleClientProps {
  isOwner: boolean;
  workingHours: WorkingHoursWithBlocks[];
  initialTimeBlocks: TimeBlock[];
  workingHoursKey: string;
}

export function ScheduleClient({
  isOwner,
  workingHours,
  initialTimeBlocks,
  workingHoursKey,
}: ScheduleClientProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div>
        {isOwner ? (
          <ScheduleForm key={workingHoursKey} workingHours={workingHours} />
        ) : (
          <ReadOnlyScheduleView workingHours={workingHours} />
        )}
      </div>

      <Separator />

      <Card className="mx-auto max-w-7xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Bloqueos Horarios</CardTitle>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Crear bloqueo
          </Button>
        </CardHeader>
        <CardContent>
          <TimeBlockList timeBlocks={initialTimeBlocks} />
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          {isModalOpen && (
            <Suspense fallback={<ModalContentSkeleton />}>
              <AddTimeBlockModalContent onClose={() => setModalOpen(false)} />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
