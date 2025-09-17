"use client";

import { WorkingHours, WorkScheduleBlock, WorkShiftType } from "@prisma/client";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { saveSchedule } from "@/actions/dashboard.actions";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Loader2Icon, Plus, Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";

const daysOfWeek = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const shiftTypes: WorkShiftType[] = ["MORNING", "AFTERNOON", "NIGHT"];
const shiftNames: Record<WorkShiftType, string> = {
  MORNING: "Mañana",
  AFTERNOON: "Tarde",
  NIGHT: "Noche",
};

const shiftConfig = {
  MORNING: {
    name: "Mañana",
    defaultValue: { startTime: "08:00", endTime: "12:00" },
    min: "06:00",
    max: "13:00",
  },
  AFTERNOON: {
    name: "Tarde",
    defaultValue: { startTime: "14:00", endTime: "18:00" },
    min: "12:00",
    max: "20:00",
  },
  NIGHT: {
    name: "Noche",
    defaultValue: { startTime: "20:00", endTime: "23:00" },
    min: "18:00",
    max: "23:59",
  },
};

type WorkingHoursWithBlocks = WorkingHours & {
  blocks: WorkScheduleBlock[];
};

interface ScheduleFormProps {
  workingHours: WorkingHoursWithBlocks[];
  isReadOnly?: boolean;
}

type ShiftState = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type DayScheduleState = {
  dayOfWeek: number;
  isWorking: boolean;
  shifts: Record<WorkShiftType, ShiftState>;
};

export default function ScheduleForm({
  workingHours,
  isReadOnly,
}: ScheduleFormProps) {
  const [schedule, setSchedule] = useState<DayScheduleState[]>(() =>
    daysOfWeek.map((_, index) => {
      const dayData = workingHours.find((wh) => wh.dayOfWeek === index);

      const getShift = (type: WorkShiftType): ShiftState => {
        const block = dayData?.blocks.find((b) => b.type === type);
        return {
          enabled: !!block,
          startTime:
            block?.startTime || shiftConfig[type].defaultValue.startTime,
          endTime: block?.endTime || shiftConfig[type].defaultValue.endTime,
        };
      };

      const shifts = {
        MORNING: getShift("MORNING"),
        AFTERNOON: getShift("AFTERNOON"),
        NIGHT: getShift("NIGHT"),
      };

      const hasEnabledShifts = Object.values(shifts).some((s) => s.enabled);
      if (dayData?.isWorking && !hasEnabledShifts) {
        shifts.MORNING.enabled = true;
      }

      return {
        dayOfWeek: index,
        isWorking: dayData?.isWorking ?? false,
        shifts,
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

  const handleShiftTimeChange = (
    dayIndex: number,
    shiftType: WorkShiftType,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayIndex
          ? {
              ...day,
              shifts: {
                ...day.shifts,
                [shiftType]: { ...day.shifts[shiftType], [field]: value },
              },
            }
          : day
      )
    );
  };

  const handleAddShift = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek === dayIndex) {
          const firstDisabledShift = shiftTypes.find(
            (type) => !day.shifts[type].enabled
          );
          if (firstDisabledShift) {
            return {
              ...day,
              shifts: {
                ...day.shifts,
                [firstDisabledShift]: {
                  ...day.shifts[firstDisabledShift],
                  enabled: true,
                },
              },
            };
          }
        }
        return day;
      })
    );
  };

  const handleRemoveShift = (dayIndex: number, shiftType: WorkShiftType) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayIndex
          ? {
              ...day,
              shifts: {
                ...day.shifts,
                [shiftType]: { ...day.shifts[shiftType], enabled: false },
              },
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
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardContent className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-2">
          {schedule.map((day, dayIndex) => {
            const enabledShifts = shiftTypes.filter(
              (type) => day.shifts[type].enabled
            );
            const canAddMore = enabledShifts.length < 3;

            return (
              <div
                key={day.dayOfWeek}
                className="flex flex-col p-4 space-y-4 border rounded-lg"
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
                </div>

                {day.isWorking && (
                  <div className="flex-grow pl-2 space-y-4">
                    {enabledShifts.map((shiftType, index) => (
                      <div key={shiftType}>
                        {index > 0 && <Separator className="mb-4" />}
                        {enabledShifts.length > 1 && (
                          <div className="flex items-center justify-between gap-2">
                            <Label>{shiftNames[shiftType]}</Label>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveShift(dayIndex, shiftType)
                              }
                              disabled={isReadOnly}
                              aria-label="Eliminar jornada"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 mt-2">
                          <Input
                            type="time"
                            value={day.shifts[shiftType].startTime}
                            min={shiftConfig[shiftType].min}
                            max={shiftConfig[shiftType].max}
                            onChange={(e) =>
                              handleShiftTimeChange(
                                dayIndex,
                                shiftType,
                                "startTime",
                                e.target.value
                              )
                            }
                            disabled={isReadOnly}
                          />
                          <span className="text-center text-muted-foreground">
                            -
                          </span>
                          <Input
                            type="time"
                            value={day.shifts[shiftType].endTime}
                            min={day.shifts[shiftType].startTime}
                            max={shiftConfig[shiftType].max}
                            onChange={(e) =>
                              handleShiftTimeChange(
                                dayIndex,
                                shiftType,
                                "endTime",
                                e.target.value
                              )
                            }
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {day.isWorking && !isReadOnly && canAddMore && (
                  <div className="pt-2 mt-auto">
                    <Separator className="mb-4" />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleAddShift(dayIndex)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar jornada
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
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
