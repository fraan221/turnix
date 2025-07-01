import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import BarberCalendar from "@/components/BarberCalendar";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No estás autorizado.</p>;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agenda de Turnos</h1>
        <p className="text-muted-foreground">
          Aquí puedes ver y gestionar todos tus turnos.
        </p>
      </div>
      <BarberCalendar bookings={bookings} services={services} />
    </div>
  );
}