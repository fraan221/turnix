"use client";

import { WorkingHours, WorkScheduleBlock } from "@prisma/client";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { saveSchedule } from "@/actions/dashboard.actions";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Loader2Icon, PlusCircle, Trash2 } from "lucide-react";

const daysOfWeek = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

// Tipo extendido para la página de horarios
type WorkingHoursWithBlocks = WorkingHours & {
  blocks: WorkScheduleBlock[];
};

interface ScheduleFormProps {
  workingHours: WorkingHoursWithBlocks[];
  isReadOnly?: boolean;
}

// Tipos para el estado del formulario
type TimeBlockState = {
  startTime: string;
  endTime: string;
};

type DayScheduleState = {
  dayOfWeek: number;
  isWorking: boolean;
  blocks: TimeBlockState[];
};

export default function ScheduleForm({
  workingHours,
  isReadOnly,
}: ScheduleFormProps) {
  const [schedule, setSchedule] = useState<DayScheduleState[]>(() =>
    daysOfWeek.map((_, index) => {
      const dayData = workingHours.find((wh) => wh.dayOfWeek === index);
      // Migra los datos del formato antiguo si existen y no hay bloques nuevos
      const initialBlocks =
        dayData?.blocks && dayData.blocks.length > 0
          ? dayData.blocks
          : dayData?.startTime && dayData.endTime
            ? [{ startTime: dayData.startTime, endTime: dayData.endTime }]
            : [{ startTime: "09:00", endTime: "18:00" }];

      return {
        dayOfWeek: index,
        isWorking: dayData?.isWorking ?? false,
        blocks: initialBlocks.map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
        })),
      };
    })
  );

  const [isPending, startTransition] = useTransition();

  const handleDayToggle = (dayIndex: number, checked: boolean) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayIndex ? { ...day, isWorking: checked } : day
      )
    );
  };

  const handleBlockChange = (
    dayIndex: number,
    blockIndex: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek === dayIndex) {
          const updatedBlocks = day.blocks.map((block, bIndex) =>
            bIndex === blockIndex ? { ...block, [field]: value } : block
          );
          return { ...day, blocks: updatedBlocks };
        }
        return day;
      })
    );
  };

  const addBlock = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayIndex
          ? {
              ...day,
              blocks: [...day.blocks, { startTime: "09:00", endTime: "18:00" }],
            }
          : day
      )
    );
  };

  const removeBlock = (dayIndex: number, blockIndex: number) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayIndex
          ? {
              ...day,
              blocks: day.blocks.filter((_, bIndex) => bIndex !== blockIndex),
            }
          : day
      )
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveSchedule(schedule);
      if (result.success) {
        toast.success("¡Éxito!", { description: result.success });
      }
      if (result.error) {
        toast.error("Error", { description: result.error });
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <Card>
        <CardContent className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
          {schedule.map((day, dayIndex) => (
            <div
              key={day.dayOfWeek}
              className="p-4 space-y-4 border rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch
                    id={`switch-${dayIndex}`}
                    checked={day.isWorking}
                    onCheckedChange={(checked) =>
                      handleDayToggle(dayIndex, checked)
                    }
                    disabled={isReadOnly}
                  />
                  <Label
                    htmlFor={`switch-${dayIndex}`}
                    className="text-lg font-medium"
                  >
                    {daysOfWeek[day.dayOfWeek]}
                  </Label>
                </div>
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => addBlock(dayIndex)}
                    disabled={!day.isWorking || isReadOnly}
                  >
                    <PlusCircle className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {day.isWorking && (
                <div className="pl-2 space-y-3">
                  {day.blocks.map((block, blockIndex) => (
                    <div key={blockIndex} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={block.startTime}
                        onChange={(e) =>
                          handleBlockChange(
                            dayIndex,
                            blockIndex,
                            "startTime",
                            e.target.value
                          )
                        }
                        disabled={isReadOnly}
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={block.endTime}
                        onChange={(e) =>
                          handleBlockChange(
                            dayIndex,
                            blockIndex,
                            "endTime",
                            e.target.value
                          )
                        }
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && day.blocks.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBlock(dayIndex, blockIndex)}
                          disabled={isReadOnly}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      {!isReadOnly && (
        <Button
          onClick={handleSave}
          className="flex w-full mx-auto mt-6 md:w-80"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Guardar horarios
            </>
          )}
        </Button>
      )}
    </div>
  );
}
