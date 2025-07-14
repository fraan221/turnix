import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import ScheduleForm from "@/components/ScheduleForm";
import TimeBlockList from "@/components/TimeBlockList";
import AddTimeBlockModal from "@/components/AddTimeBlockModal";

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const [workingHours, timeBlocks] = await Promise.all([
    prisma.workingHours.findMany({
      where: { barberId: session.user.id },
      orderBy: { dayOfWeek: "asc" },
    }),
    prisma.timeBlock.findMany({
      where: { barberId: session.user.id },
      orderBy: { startTime: "desc" },
    }),
  ]);

  const workingHoursKey = JSON.stringify(workingHours);

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Horarios
        </h2>
        <p className="text-muted-foreground">
          Define tus horas de trabajo para cada día.
        </p>
        <div className="mt-6">
          <ScheduleForm key={workingHoursKey} workingHours={workingHours} />
        </div>
      </div>

      <hr />

      <div>
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1">
            <h2 className="text-2xl font-bold md:text-3xl">
              Bloqueos Horarios
            </h2>
            <p className="text-muted-foreground">
              Añade fechas y horas en las que no estarás disponible.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <AddTimeBlockModal />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-4 text-lg font-semibold">Bloqueos Activos</h3>
          <TimeBlockList timeBlocks={timeBlocks} />
        </div>
      </div>
    </div>
  );
}
