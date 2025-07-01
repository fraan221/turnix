import { createTimeBlock } from "@/actions/dashboard.actions";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function TimeBlockForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Bloqueo Horario</CardTitle>
      </CardHeader>
      <CardContent className="py-2 border rounded-lg border-black/10">
        <form action={createTimeBlock} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Fin</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora de Inicio</Label>
              <Input id="startTime" name="startTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora de Fin</Label>
              <Input id="endTime" name="endTime" type="time" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Razón (Opcional)</Label>
            <Input id="reason" name="reason" placeholder="Ej: Vacaciones, Feriado" />
          </div>
          <Button type="submit" className="w-full">Bloquear Horario</Button>
        </form>
      </CardContent>
    </Card>
  );
}