import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import ScheduleForm from "@/components/ScheduleForm";
import TimeBlockList from "@/components/TimeBlockList";
import AddTimeBlockModal from "@/components/AddTimeBlockModal";
import { Separator } from "@/components/ui/separator";
import { Role, WorkingHours } from "@prisma/client";
import { ReadOnlyScheduleView } from "@/components/schedule/ReadOnlyScheduleView";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  let barbershopWorkingHours: WorkingHours[] = [];
  const isOwner = session.user.role === Role.OWNER;

  if (isOwner) {
    barbershopWorkingHours = await prisma.workingHours.findMany({
      where: { barberId: session.user.id },
      orderBy: { dayOfWeek: "asc" },
    });
  } else {
    const teamMembership = await prisma.team.findUnique({
      where: { userId: session.user.id },
      include: { barbershop: true },
    });

    if (teamMembership) {
      barbershopWorkingHours = await prisma.workingHours.findMany({
        where: { barberId: teamMembership.barbershop.ownerId },
        orderBy: { dayOfWeek: "asc" },
      });
    }
  }

  const timeBlocks = await prisma.timeBlock.findMany({
    where: { barberId: session.user.id },
    orderBy: { startTime: "desc" },
  });

  const workingHoursKey = JSON.stringify(barbershopWorkingHours);

  return (
    <div className="space-y-12">
      <div>
        <div>
          {isOwner ? (
            <ScheduleForm
              key={workingHoursKey}
              workingHours={barbershopWorkingHours}
            />
          ) : (
            <ReadOnlyScheduleView workingHours={barbershopWorkingHours} />
          )}
        </div>
      </div>

      <Separator />

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Bloqueos Horarios</CardTitle>
          <AddTimeBlockModal />
        </CardHeader>
        <CardContent>
          <TimeBlockList timeBlocks={timeBlocks} />
        </CardContent>
      </Card>
    </div>
  );
}
