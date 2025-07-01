import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import ScheduleForm from "@/components/ScheduleForm";
import TimeBlockForm from "@/components/TimeBlockForm";
import { Button } from "@/components/ui/button";
import { deleteTimeBlock } from "@/actions/dashboard.actions";

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const workingHours = await prisma.workingHours.findMany({
    where: { barberId: session.user.id },
    orderBy: { dayOfWeek: 'asc' },
  });

  const timeBlocks = await prisma.timeBlock.findMany({
    where: { barberId: session.user.id },
    orderBy: { startTime: 'desc' },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold ">Horarios</h1>
        <h2 className="mb-4 text-lg text-gray-500">Aqui puedes gestionar los horarios de tu barbería.</h2>
        <ScheduleForm workingHours={workingHours} />
      </div>

      <div>
        <h2 className="mb-4 text-3xl font-bold">Bloqueo de Horarios Laborales</h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="md:col-span-1">
            <TimeBlockForm />
          </div>
          <div className="md:col-span-2">
            <h3 className="mb-4 text-2xl font-semibold">Bloqueos Activos</h3>
            <div className="space-y-3">
              {timeBlocks.length === 0 ? (
                <p>No tienes ningún bloqueo programado.</p>
              ) : (
                timeBlocks.map(block => (
                  <div key={block.id} className="flex items-center justify-between p-3 border rounded-md border-black-15">
                    <div>
                      <p className="font-semibold text-md">{block.reason || "Bloqueo Horario"}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(block.startTime).toLocaleString()} - {new Date(block.endTime).toLocaleString()}
                      </p>
                    </div>
                    <form action={deleteTimeBlock.bind(null, block.id)}>
                      <Button variant="destructive" size="sm" type="submit">Eliminar</Button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}