"use client";

import { useState, useTransition } from "react";
import { WorkingHours, WorkScheduleBlock, WorkShiftType } from "@prisma/client";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { saveSchedule } from "@/actions/dashboard.actions";

const daysOfWeek = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const shiftNames: Record<WorkShiftType, string> = {
  MORNING: "Mañana",
  AFTERNOON: "Tarde",
  NIGHT: "Noche",
};

const shiftConfig: Record<
  WorkShiftType,
  {
    name: string;
    defaultValue: { startTime: string; endTime: string };
    min: string;
    max: string;
  }
> = {
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

const shiftTypes: WorkShiftType[] = ["MORNING", "AFTERNOON", "NIGHT"];

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
  isReadOnly = false,
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
        toast.success("¡Horarios guardados!", {
          description: "Tus cambios se aplicaron correctamente.",
        });
      }
      if (result.error) {
        toast.error("No se pudieron guardar los horarios", {
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card className="border-2">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {schedule.map((day) => {
              const enabledShifts = shiftTypes.filter(
                (type) => day.shifts[type].enabled
              );
              const canAddMore = enabledShifts.length < 3;

              return (
                <div
                  key={day.dayOfWeek}
                  className="flex flex-col p-4 space-y-4 transition-colors border-2 rounded-xl hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        id={`switch-${day.dayOfWeek}`}
                        checked={day.isWorking}
                        onCheckedChange={(checked) =>
                          handleDayToggle(day.dayOfWeek, checked)
                        }
                        disabled={isReadOnly}
                      />
                      <Label
                        htmlFor={`switch-${day.dayOfWeek}`}
                        className="text-base font-semibold cursor-pointer sm:text-lg"
                      >
                        {daysOfWeek[day.dayOfWeek]}
                      </Label>
                    </div>
                    {!day.isWorking && (
                      <span className="px-2 py-1 text-xs rounded-md text-muted-foreground bg-muted/50">
                        Cerrado
                      </span>
                    )}
                  </div>

                  {day.isWorking && (
                    <div className="flex-grow pl-1 space-y-4">
                      {enabledShifts.map((shiftType, index) => (
                        <div key={shiftType}>
                          {index > 0 && <Separator className="mb-4" />}

                          {enabledShifts.length > 1 && (
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <Label className="text-sm font-medium">
                                  {shiftNames[shiftType]}
                                </Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8"
                                onClick={() =>
                                  handleRemoveShift(day.dayOfWeek, shiftType)
                                }
                                disabled={isReadOnly}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                                <span className="sr-only">
                                  Eliminar jornada {shiftNames[shiftType]}
                                </span>
                              </Button>
                            </div>
                          )}

                          <div className="flex flex-col items-center gap-2 sm:flex-row">
                            <Input
                              type="time"
                              value={day.shifts[shiftType].startTime}
                              min={shiftConfig[shiftType].min}
                              max={shiftConfig[shiftType].max}
                              onChange={(e) =>
                                handleShiftTimeChange(
                                  day.dayOfWeek,
                                  shiftType,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              disabled={isReadOnly}
                            />
                            <span className="flex-shrink-0 text-sm font-medium text-muted-foreground">
                              —
                            </span>
                            <Input
                              type="time"
                              value={day.shifts[shiftType].endTime}
                              min={day.shifts[shiftType].startTime}
                              max={shiftConfig[shiftType].max}
                              onChange={(e) =>
                                handleShiftTimeChange(
                                  day.dayOfWeek,
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
                        size="sm"
                        className="w-full"
                        onClick={() => handleAddShift(day.dayOfWeek)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Jornada
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!isReadOnly && (
        <div className="flex justify-center">
          <Button
            onClick={handleSave}
            disabled={isPending}
            size="lg"
            className="w-full sm:w-auto sm:min-w-[280px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Horarios
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
