import { WorkingHours } from "@prisma/client";
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
    <div className="grid max-w-4xl grid-cols-1 gap-4 mx-auto lg:grid-cols-2">
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
              <Badge variant="secondary" className="text-base">
                Día libre
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
