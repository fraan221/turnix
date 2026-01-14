import prisma from "@/lib/prisma";
import { getUserForDashboard } from "@/lib/data";
import { Suspense } from "react";
import { Role } from "@prisma/client";
import { ConnectionCodeView } from "@/components/team/ConnectionCodeView";
import dynamic from "next/dynamic";
import BarberCalendarSkeleton from "@/components/BarberCalendarSkeleton";

const BarberCalendarWrapper = dynamic(
  () => import("@/components/BarberCalendar"),
  {
    ssr: false,
    loading: () => <BarberCalendarSkeleton />,
  }
);

async function CalendarDataWrapper({
  targetBarberId,
  teamMembers,
}: {
  targetBarberId: string;
  teamMembers: { id: string; name: string }[];
}) {
  const [bookings, services] = await Promise.all([
    prisma.booking.findMany({
      where: { barberId: targetBarberId },
      include: { service: true, client: true },
    }),
    prisma.service.findMany({
      where: { barberId: targetBarberId },
    }),
  ]);

  return (
    <BarberCalendarWrapper
      bookings={bookings}
      services={services}
      teamMembers={teamMembers}
      selectedBarberId={targetBarberId}
    />
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { barberId?: string };
}) {
  const user = await getUserForDashboard();

  if (!user) {
    return <p>No estás autorizado.</p>;
  }

  if (
    user.role === Role.BARBER &&
    !user.teamMembership &&
    user.connectionCode
  ) {
    return <ConnectionCodeView connectionCode={user.connectionCode} />;
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
  }

  return (
    <>
      <Suspense fallback={<BarberCalendarSkeleton />}>
        <CalendarDataWrapper
          targetBarberId={targetBarberId}
          teamMembers={teamMembers}
        />
      </Suspense>
    </>
  );
}
