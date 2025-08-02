import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import BarberCalendar from "@/components/BarberCalendar";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p>No estás autorizado.</p>;
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

  return <BarberCalendar bookings={bookings} services={services} />;
}
