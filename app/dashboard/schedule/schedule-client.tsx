"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ScheduleForm from "@/components/ScheduleForm";
import TimeBlockList from "@/components/TimeBlockList";
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
          <Skeleton className="mt-1 w-10/12 h-4" />
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Skeleton className="w-full h-32" />
      </div>
    </>
  );
}

interface ScheduleClientProps {
  isOwner: boolean;
  workingHours: WorkingHoursWithBlocks[];
  initialTimeBlocks: TimeBlock[];
  workingHoursKey: string;
  selectedBarberId: string;
  teamMembers: { id: string; name: string }[];
}

export function ScheduleClient({
  isOwner,
  workingHours,
  initialTimeBlocks,
  workingHoursKey,
  selectedBarberId,
  teamMembers,
}: ScheduleClientProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const handleBarberChange = (value: string) => {
    router.push(`/dashboard/schedule?barberId=${value}`);
  };

  return (
    <div className="px-4 pb-6 mx-auto space-y-8 w-full max-w-6xl sm:px-6">
      {isOwner && teamMembers.length > 1 && (
        <div className="flex justify-end mb-4">
          <div className="w-full sm:w-[280px]">
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider">
              Gestionando horarios de:
            </label>
            <Select value={selectedBarberId} onValueChange={handleBarberChange}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Seleccionar barbero" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <section>
        <ScheduleForm
          key={workingHoursKey}
          workingHours={workingHours}
          barberId={selectedBarberId}
        />
      </section>

      <Separator />

      <section>
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="flex gap-2 items-center text-xl sm:text-2xl">
                  <CalendarX className="w-5 h-5 text-muted-foreground" />
                  Bloqueos de Horario
                </CardTitle>
                <CardDescription className="text-sm">
                  {isOwner
                    ? "Bloqueá horarios cuando no se pueda atender (vacaciones, eventos, etc.)"
                    : "Bloqueá horarios cuando no estés disponible para atender"}
                </CardDescription>
              </div>

              <Button
                onClick={() => setModalOpen(true)}
                size="lg"
                className="w-full sm:w-auto shrink-0"
              >
                <Plus className="mr-2 w-4 h-4" />
                Crear Bloqueo
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <TimeBlockList timeBlocks={initialTimeBlocks} />
          </CardContent>
        </Card>
      </section>

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
