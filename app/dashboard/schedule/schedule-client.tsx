"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { TimeBlock } from "@prisma/client";
import { Plus, CalendarX } from "lucide-react";
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

function ModalContentSkeleton() {
  return (
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
}

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
    <div className="w-full max-w-6xl px-4 pb-6 mx-auto space-y-8 sm:px-6">
      {/* Sección de horarios semanales */}
      <section>
        {isOwner ? (
          <ScheduleForm key={workingHoursKey} workingHours={workingHours} />
        ) : (
          <ReadOnlyScheduleView workingHours={workingHours} />
        )}
      </section>

      <Separator />

      {/* Sección de bloqueos de horario */}
      <section>
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <CalendarX className="w-5 h-5 text-muted-foreground" />
                  Bloqueos de Horario
                </CardTitle>
                <CardDescription className="text-sm">
                  {isOwner
                    ? "Bloqueá horarios cuando no puedas atender (vacaciones, eventos, etc.)"
                    : "Bloqueá horarios cuando no estés disponible para atender"}
                </CardDescription>
              </div>

              <Button
                onClick={() => setModalOpen(true)}
                size="lg"
                className="w-full sm:w-auto shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Bloqueo
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <TimeBlockList timeBlocks={initialTimeBlocks} />
          </CardContent>
        </Card>
      </section>

      {/* Modal de crear bloqueo */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[500px]">
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
