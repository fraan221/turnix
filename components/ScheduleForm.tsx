"use client";

import { WorkingHours } from "@prisma/client";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { saveSchedule } from "@/actions/dashboard.actions";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface ScheduleFormProps {
  workingHours: WorkingHours[];
}

type DaySchedule = {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
};

export default function ScheduleForm({ workingHours }: ScheduleFormProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => 
    daysOfWeek.map((_, index) => {
      const dayData = workingHours.find(wh => wh.dayOfWeek === index);
      return {
        dayOfWeek: index,
        isWorking: dayData?.isWorking ?? false,
        startTime: dayData?.startTime || "09:00",
        endTime: dayData?.endTime || "22:00",
      };
    })
  );
  
  const [isPending, startTransition] = useTransition();

  const handleSwitchChange = (dayIndex: number, checked: boolean) => {
    setSchedule(currentSchedule =>
      currentSchedule.map(day =>
        day.dayOfWeek === dayIndex ? { ...day, isWorking: checked } : day
      )
    );
  };
  
  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(currentSchedule =>
      currentSchedule.map(day =>
        day.dayOfWeek === dayIndex ? { ...day, [field]: value } : day
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
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          {schedule.map((dayConfig, index) => {
            const dayName = daysOfWeek[index];
            return (
              <div key={index} className="flex flex-col items-center justify-between p-4 border rounded-lg lg:flex-row">
                <div className="flex items-center gap-4 mb-4 lg:mb-0">
                  <Switch 
                    id={`switch-${index}`}
                    checked={dayConfig.isWorking}
                    onCheckedChange={(checked) => handleSwitchChange(index, checked)}
                  />
                  <Label htmlFor={`switch-${index}`} className="text-lg font-medium w-28">{dayName}</Label>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <Input 
                    type="time" 
                    value={dayConfig.startTime}
                    onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                    disabled={!dayConfig.isWorking}
                  />
                  <span>-</span>
                  <Input 
                    type="time" 
                    value={dayConfig.endTime}
                    onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                    disabled={!dayConfig.isWorking}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Button onClick={handleSave} className="flex w-full mx-auto mt-6 lg:w-80" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar Horarios"}
      </Button>
    </div>
  );
}
