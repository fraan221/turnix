import { Suspense } from "react";
import TimeBlockListSkeleton from "@/components/skeletons/TimeBlockListSkeleton";
import { getUserForDashboard } from "@/lib/data";
import prisma from "@/lib/prisma";
import ScheduleForm from "@/components/ScheduleForm";
import TimeBlockList from "@/components/TimeBlockList";
import AddTimeBlockModal from "@/components/AddTimeBlockModal";
import { Separator } from "@/components/ui/separator";
import { Role, WorkingHours, WorkScheduleBlock } from "@prisma/client";
import { ReadOnlyScheduleView } from "@/components/schedule/ReadOnlyScheduleView";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

async function TimeBlocksSection() {
  const user = await getUserForDashboard();
  if (!user) return null;

  const timeBlocks = await prisma.timeBlock.findMany({
    where: { barberId: user.id },
    orderBy: { startTime: "desc" },
  });

  return (
    <Card className="mx-auto max-w-7xl">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Bloqueos Horarios</CardTitle>
        <AddTimeBlockModal />
      </CardHeader>
      <CardContent>
        <TimeBlockList timeBlocks={timeBlocks} />
      </CardContent>
    </Card>
  );
}

export default async function SchedulePage() {
  const user = await getUserForDashboard();
  if (!user) return <p>No autorizado</p>;

  let barbershopWorkingHours: (WorkingHours & {
    blocks: WorkScheduleBlock[];
  })[] = [];
  const isOwner = user.role === Role.OWNER;

  if (isOwner) {
    barbershopWorkingHours = await prisma.workingHours.findMany({
      where: { barberId: user.id },
      orderBy: { dayOfWeek: "asc" },
      include: { blocks: true },
    });
  } else {
    const teamMembership = user.teamMembership;

    if (teamMembership) {
      const barbershop = await prisma.barbershop.findUnique({
        where: { id: teamMembership.barbershopId },
        select: { ownerId: true },
      });

      if (barbershop) {
        barbershopWorkingHours = await prisma.workingHours.findMany({
          where: { barberId: barbershop.ownerId },
          orderBy: { dayOfWeek: "asc" },
          include: { blocks: true },
        });
      }
    }
  }

  const workingHoursKey = JSON.stringify(barbershopWorkingHours);

  return (
    <div className="space-y-12">
      <div>
        <div>
          {isOwner ? (
            <ScheduleForm
              key={workingHoursKey}
              workingHours={barbershopWorkingHours}
            />
          ) : (
            <ReadOnlyScheduleView workingHours={barbershopWorkingHours} />
          )}
        </div>
      </div>

      <Separator />

      <Suspense fallback={<TimeBlockListSkeleton />}>
        <TimeBlocksSection />
      </Suspense>
    </div>
  );
}
