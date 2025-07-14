import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import BarberCalendar from "@/components/BarberCalendar";
import OnboardingCard from "@/components/OnboardingCard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No estás autorizado.</p>;

  const [user, bookings, services, workingHours] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { slug: true, onboardingCompleted: true },
    }),
    prisma.booking.findMany({
      where: { barberId: session.user.id },
      include: { service: true, client: true },
    }),
    prisma.service.findMany({
      where: { barberId: session.user.id },
    }),
    prisma.workingHours.findMany({
      where: { barberId: session.user.id, isWorking: true },
    }),
  ]);

  const hasServices = services.length > 0;
  const hasWorkingHours = workingHours.length > 0;
  const hasSlug = !!user?.slug;

  const showOnboarding = !user?.onboardingCompleted;

  return (
    <div className="space-y-6">
      {showOnboarding && (
        <OnboardingCard
          userSlug={user?.slug ?? null}
          hasServices={hasServices}
          hasWorkingHours={hasWorkingHours}
          hasSlug={hasSlug}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Agenda
        </h1>
        <p className="text-muted-foreground">
          Aquí puedes ver y gestionar todos tus turnos.
        </p>
      </div>
      <BarberCalendar bookings={bookings} services={services} />
    </div>
  );
}
