import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import ScheduleForm from "@/components/ScheduleForm";
import TimeBlockForm from "@/components/TimeBlockForm";
import TimeBlockList from "@/components/TimeBlockList";

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const [workingHours, timeBlocks] = await Promise.all([
    prisma.workingHours.findMany({
      where: { barberId: session.user.id },
      orderBy: { dayOfWeek: 'asc' },
    }),
    prisma.timeBlock.findMany({
      where: { barberId: session.user.id },
      orderBy: { startTime: 'desc' },
    }),
  ]);

  const workingHoursKey = JSON.stringify(workingHours);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="mb-4 text-3xl font-bold">Definir Mi Horario Semanal</h1>
        <ScheduleForm key={workingHoursKey} workingHours={workingHours} />
      </div>

      <hr />

      <div>
        <h2 className="mb-4 text-3xl font-bold">Bloqueos de Tiempo Específicos</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <TimeBlockForm />
          </div>
          <div className="md:col-span-2">
            <h3 className="mb-4 text-xl font-semibold">Mis Bloqueos Activos</h3>
            <TimeBlockList timeBlocks={timeBlocks} />
          </div>
        </div>
      </div>
    </div>
  );
}
