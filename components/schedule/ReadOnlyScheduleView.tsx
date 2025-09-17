import { Badge } from "@/components/ui/badge";
import { WorkingHours, WorkScheduleBlock, WorkShiftType } from "@prisma/client";

export type WorkingHoursWithBlocks = WorkingHours & {
  blocks: WorkScheduleBlock[];
};

interface ReadOnlyScheduleViewProps {
  workingHours: WorkingHoursWithBlocks[];
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

const shiftTypeTranslations: Record<WorkShiftType, string> = {
  MORNING: "Mañana",
  AFTERNOON: "Tarde",
  NIGHT: "Noche",
};

export function ReadOnlyScheduleView({
  workingHours,
}: ReadOnlyScheduleViewProps) {
  const scheduleMap = new Map<number, WorkingHoursWithBlocks>();
  workingHours.forEach((wh) => {
    scheduleMap.set(wh.dayOfWeek, wh);
  });

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {daysOfWeek.map((dayName, index) => {
        const daySchedule = scheduleMap.get(index);
        const isWorking = daySchedule?.isWorking ?? false;
        const sortedBlocks = daySchedule?.blocks
          ? [...daySchedule.blocks].sort((a, b) => {
              const order = { MORNING: 1, AFTERNOON: 2, NIGHT: 3 };
              return order[a.type] - order[b.type];
            })
          : [];

        return (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <span className="font-semibold">{dayName}</span>

              {isWorking && sortedBlocks.length > 0 ? (
                <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                  {sortedBlocks.length === 1 ? (
                    <Badge variant="secondary" className="flex-shrink-0">
                      <span>
                        {sortedBlocks[0].startTime} - {sortedBlocks[0].endTime}
                      </span>
                    </Badge>
                  ) : (
                    sortedBlocks.map((block) => (
                      <Badge
                        key={block.id}
                        variant="secondary"
                        className="flex-shrink-0"
                      >
                        <span className="hidden font-semibold sm:inline-block mr-1.5">
                          {shiftTypeTranslations[block.type]}:
                        </span>
                        <span>
                          {block.startTime} - {block.endTime}
                        </span>
                      </Badge>
                    ))
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="self-start sm:self-auto">
                  No laboral
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
