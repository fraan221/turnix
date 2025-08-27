import { WorkingHours } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReadOnlyScheduleViewProps {
  workingHours: WorkingHours[];
}

const daysOfWeek = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function ReadOnlyScheduleView({
  workingHours,
}: ReadOnlyScheduleViewProps) {
  const scheduleMap = new Map<number, WorkingHours>();
  workingHours.forEach((wh) => {
    scheduleMap.set(wh.dayOfWeek, wh);
  });

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Horarios de la Barbería</CardTitle>
          <CardDescription>
            Estos son los horarios de trabajo establecidos por el dueño. No
            puedes editarlos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {daysOfWeek.map((dayName, index) => {
            const daySchedule = scheduleMap.get(index);
            const isWorking = daySchedule?.isWorking ?? false;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <span className="text-lg font-medium">{dayName}</span>
                {isWorking && daySchedule ? (
                  <Badge variant="secondary" className="text-base">
                    {daySchedule.startTime} - {daySchedule.endTime}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-base">
                    No trabaja
                  </Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
