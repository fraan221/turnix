import { WorkingHours } from "@prisma/client";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { updateWorkingHours } from "@/actions/dashboard.actions";

const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface ScheduleFormProps {
  workingHours: WorkingHours[];
}

export default function ScheduleForm({ workingHours }: ScheduleFormProps) {
  return (
    <form action={updateWorkingHours} className="max-w-5xl mx-auto">
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-0 lg:grid-cols-2">
          {daysOfWeek.map((day, index) => {
            const dayData = workingHours.find(wh => wh.dayOfWeek === index);
            const dayId = day.toLowerCase().substring(0, 3);
            return (
              <div key={index} className="flex flex-col items-center justify-between p-4 border rounded-lg lg:flex-row">
                <div className="flex items-center gap-4 mb-2 lg:mb-0">
                  <Switch 
                    id={`${dayId}-isWorking`} 
                    name={`${dayId}-isWorking`}
                    defaultChecked={dayData?.isWorking ?? false}
                  />
                  <Label htmlFor={`${dayId}-isWorking`} className="text-lg font-medium w-28">{day}</Label>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <Input type="time" name={`${dayId}-startTime`} defaultValue={dayData?.startTime || "09:00"} />
                  <span>-</span>
                  <Input type="time" name={`${dayId}-endTime`} defaultValue={dayData?.endTime || "18:00"} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Button type="submit" className="flex w-full mx-auto mt-3 lg:w-80">Guardar Horarios</Button>
    </form>
  );
}