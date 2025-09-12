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

async function CalendarDataWrapper({ userId }: { userId: string }) {
  const [bookings, services] = await Promise.all([
    prisma.booking.findMany({
      where: { barberId: userId },
      include: { service: true, client: true },
    }),
    prisma.service.findMany({
      where: { barberId: userId },
    }),
  ]);

  return <BarberCalendarWrapper bookings={bookings} services={services} />;
}

export default async function DashboardPage() {
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

  return (
    <>
      <Suspense fallback={<BarberCalendarSkeleton />}>
        <CalendarDataWrapper userId={user.id} />
      </Suspense>
    </>
  );
}
