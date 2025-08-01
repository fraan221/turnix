import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import ScheduleForm from "@/components/ScheduleForm";
import TimeBlockList from "@/components/TimeBlockList";
import AddTimeBlockModal from "@/components/AddTimeBlockModal";
import { Separator } from "@/components/ui/separator";

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
        <h1 className="text-2xl font-bold tracking-tight font-heading md:text-3xl">
          Horarios
        </h1>
        <div>
          <ScheduleForm key={workingHoursKey} workingHours={workingHours} />
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1">
            <h1 className="text-2xl font-bold tracking-tight font-heading md:text-3xl">
              Bloqueos Horarios
            </h1>
          </div>
          <div className="w-full md:w-auto">
            <AddTimeBlockModal />
          </div>
        </div>
        <div className="max-w-lg mx-auto mt-6">
          <h2 className="mb-4 text-lg font-semibold">Bloqueos Activos</h2>
          <TimeBlockList timeBlocks={timeBlocks} />
        </div>
      </div>
    </div>
  );
}
