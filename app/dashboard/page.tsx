import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Suspense } from "react";
import SubscriptionStatusHandler from "@/components/SubscriptionStatusHandler";
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
  const session = await auth();
  if (!session?.user?.id) {
    return <p>No estás autorizado.</p>;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      teamMembership: true,
    },
  });

  if (
    user?.role === Role.BARBER &&
    !user.teamMembership &&
    user.connectionCode
  ) {
    return <ConnectionCodeView connectionCode={user.connectionCode} />;
  }

  return (
    <>
      <Suspense>
        <SubscriptionStatusHandler />
      </Suspense>
      <Suspense fallback={<BarberCalendarSkeleton />}>
        <CalendarDataWrapper userId={session.user.id} />
      </Suspense>
    </>
  );
}
