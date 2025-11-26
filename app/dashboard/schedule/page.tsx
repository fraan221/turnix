import { Suspense } from "react";
import { getUserForDashboard } from "@/lib/data";
import prisma from "@/lib/prisma";
import { Role, WorkingHours, WorkScheduleBlock } from "@prisma/client";
import TimeBlockListSkeleton from "@/components/skeletons/TimeBlockListSkeleton";
import { ScheduleClient } from "./schedule-client";

export type WorkingHoursWithBlocks = WorkingHours & {
  blocks: WorkScheduleBlock[];
};

async function getScheduleData(searchParams: { barberId?: string }) {
  const user = await getUserForDashboard();
  if (!user) {
    throw new Error("No autorizado");
  }

  const isOwner = user.role === Role.OWNER;
  let targetBarberId = user.id;
  let teamMembers: { id: string; name: string }[] = [];

  if (isOwner) {
    const barbershop = await prisma.barbershop.findUnique({
      where: { ownerId: user.id },
      include: {
        teamMembers: {
          include: { user: true },
        },
      },
    });

    if (barbershop) {
      teamMembers = [
        { id: user.id, name: `${user.name} (Tú)` },
        ...barbershop.teamMembers.map((tm) => ({
          id: tm.userId,
          name: tm.user.name,
        })),
      ];

      if (
        searchParams.barberId &&
        teamMembers.some((m) => m.id === searchParams.barberId)
      ) {
        targetBarberId = searchParams.barberId;
      }
    }
  } else {
    targetBarberId = user.id;
  }

  let barbershopWorkingHours = await prisma.workingHours.findMany({
    where: { barberId: targetBarberId },
    orderBy: { dayOfWeek: "asc" },
    include: { blocks: true },
  });

  if (barbershopWorkingHours.length === 0) {
    let ownerId = "";

    if (isOwner) {
      ownerId = user.id;
    } else {
      const membership = await prisma.team.findUnique({
        where: { userId: user.id },
        select: { barbershop: { select: { ownerId: true } } },
      });
      ownerId = membership?.barbershop?.ownerId || "";
    }

    if (ownerId && ownerId !== targetBarberId) {
      barbershopWorkingHours = await prisma.workingHours.findMany({
        where: { barberId: ownerId },
        orderBy: { dayOfWeek: "asc" },
        include: { blocks: true },
      });
    }
  }

  const timeBlocks = await prisma.timeBlock.findMany({
    where: { barberId: targetBarberId },
    orderBy: { startTime: "desc" },
  });

  return {
    user,
    barbershopWorkingHours,
    timeBlocks,
    targetBarberId,
    teamMembers,
  };
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { barberId?: string };
}) {
  const {
    user,
    barbershopWorkingHours,
    timeBlocks,
    targetBarberId,
    teamMembers,
  } = await getScheduleData(searchParams);

  const workingHoursKey = `${targetBarberId}-${JSON.stringify(barbershopWorkingHours)}`;

  return (
    <div className="space-y-12">
      <Suspense fallback={<TimeBlockListSkeleton />}>
        <ScheduleClient
          isOwner={user.role === Role.OWNER}
          workingHours={barbershopWorkingHours}
          initialTimeBlocks={timeBlocks}
          workingHoursKey={workingHoursKey}
          selectedBarberId={targetBarberId}
          teamMembers={teamMembers}
        />
      </Suspense>
    </div>
  );
}
