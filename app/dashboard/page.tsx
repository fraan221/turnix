import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import BarberCalendar from "@/components/BarberCalendar";
import { Suspense } from "react";
import SubscriptionStatusHandler from "@/components/SubscriptionStatusHandler";
import { Role } from "@prisma/client";
import { ConnectionCodeView } from "@/components/team/ConnectionCodeView";

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

  const [bookings, services] = await Promise.all([
    prisma.booking.findMany({
      where: { barberId: session.user.id },
      include: { service: true, client: true },
    }),
    prisma.service.findMany({
      where: { barberId: session.user.id },
    }),
  ]);

  return (
    <>
      <Suspense>
        <SubscriptionStatusHandler />
      </Suspense>
      <BarberCalendar bookings={bookings} services={services} />
    </>
  );
}
