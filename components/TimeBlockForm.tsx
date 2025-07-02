"use client";

import { createTimeBlock } from "@/actions/dashboard.actions";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Bloqueando..." : "Bloquear Horario"}
    </Button>
  );
}

export default function TimeBlockForm() {
  const [state, formAction] = useFormState(createTimeBlock, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Éxito!", { description: state.success });
      formRef.current?.reset();
    }
    if (state?.error) {
      toast.error("Error", { description: state.error });
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Bloqueo</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
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
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
