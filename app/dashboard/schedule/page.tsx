import { Suspense } from "react";
import { getUserForDashboard } from "@/lib/data";
import prisma from "@/lib/prisma";
import {
  Role,
  TimeBlock,
  WorkingHours,
  WorkScheduleBlock,
} from "@prisma/client";
import TimeBlockListSkeleton from "@/components/skeletons/TimeBlockListSkeleton";
import { ScheduleClient } from "./schedule-client";

export type WorkingHoursWithBlocks = WorkingHours & {
  blocks: WorkScheduleBlock[];
};

async function getScheduleData() {
  const user = await getUserForDashboard();
  if (!user) {
    throw new Error("No autorizado");
  }

  let barbershopWorkingHours: WorkingHoursWithBlocks[] = [];
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

  const timeBlocks = await prisma.timeBlock.findMany({
    where: { barberId: user.id },
    orderBy: { startTime: "desc" },
  });

  return { user, barbershopWorkingHours, timeBlocks };
}

export default async function SchedulePage() {
  const { user, barbershopWorkingHours, timeBlocks } = await getScheduleData();

  const workingHoursKey = JSON.stringify(barbershopWorkingHours);

  return (
    <div className="space-y-12">
      <Suspense fallback={<TimeBlockListSkeleton />}>
        <ScheduleClient
          isOwner={user.role === Role.OWNER}
          workingHours={barbershopWorkingHours}
          initialTimeBlocks={timeBlocks}
          workingHoursKey={workingHoursKey}
        />
      </Suspense>
    </div>
  );
}
