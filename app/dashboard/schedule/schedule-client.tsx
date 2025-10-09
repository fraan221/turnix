"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { TimeBlock } from "@prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
import { Plus, CalendarX } from "lucide-react";
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
    <div className="max-w-6xl pb-6 mx-auto space-y-6">
      <section className="space-y-4">
        <div className="px-4 md:px-0">
          {isOwner ? (
            <ScheduleForm key={workingHoursKey} workingHours={workingHours} />
          ) : (
            <ReadOnlyScheduleView workingHours={workingHours} />
          )}
        </div>
      </section>

      <Separator className="mx-4 md:mx-0" />

      <section className="px-4 md:px-0">
        <Card className="border-0 shadow-none md:border md:shadow-sm">
          <CardHeader className="px-0 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarX className="w-5 h-5 text-muted-foreground" />
                  Bloqueos de horario
                </CardTitle>
                <CardDescription className="text-sm sr-only">
                  {isOwner
                    ? "Bloqueá horarios específicos cuando no puedas atender (vacaciones, eventos, etc.)"
                    : "Horarios no disponibles para agendar turnos"}
                </CardDescription>
              </div>

                <Button
                  onClick={() => setModalOpen(true)}
                  size="lg"
                  className="w-full sm:w-auto shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="ml-2">Crear bloqueo</span>
                </Button>
            </div>
          </CardHeader>

          <CardContent className="px-0 md:px-6">
            <TimeBlockList timeBlocks={initialTimeBlocks} />
          </CardContent>
        </Card>
      </section>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[480px] rounded-lg">
          {isModalOpen && (
            <Suspense fallback={<ModalContentSkeleton />}>
              <AddTimeBlockModalContent onClose={() => setModalOpen(false)} />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
