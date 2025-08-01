"use client";

import { createTimeBlock } from "@/actions/dashboard.actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Loader2Icon } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="mb-3">
      {pending ? (
        <>
          <Loader2Icon className="w-4 h-4 animate-spin" /> Bloqueando...
        </>
      ) : (
        "Bloquear Horario"
      )}
    </Button>
  );
}

export default function AddTimeBlockModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createTimeBlock, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Éxito!", { description: state.success });
      formRef.current?.reset();
      setOpen(false);
    }
    if (state?.error) {
      let errorMessage = "Ocurrió un error inesperado.";
      if (typeof state.error === "string") {
        errorMessage = state.error;
      } else {
        const errorValues = Object.values(state.error).flat();
        if (errorValues.length > 0) {
          errorMessage = errorValues[0] as string;
        }
      }
      toast.error("Error de validación", { description: errorMessage });
    }
  }, [state]);

  const clientAction = async (formData: FormData) => {
    const startDate = formData.get("startDate") as string;
    const startTime = formData.get("startTime") as string;
    const endDate = formData.get("endDate") as string;
    const endTime = formData.get("endTime") as string;

    const startDateTimeISO = new Date(
      `${startDate}T${startTime}`
    ).toISOString();
    const endDateTimeISO = new Date(`${endDate}T${endTime}`).toISOString();

    const newFormData = new FormData();
    newFormData.append("startDateTime", startDateTimeISO);
    newFormData.append("endDateTime", endDateTimeISO);
    newFormData.append("reason", formData.get("reason") || "");

    formAction(newFormData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" />
          Crear bloqueo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Bloqueo</DialogTitle>
          <DialogDescription>
            Define un período en el que no estarás disponible. Los clientes no
            podrán reservar en este rango.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={clientAction} className="pt-4 space-y-4">
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
            <Input
              id="reason"
              name="reason"
              placeholder="Ej: Vacaciones, Viaje de Trabajo..."
            />
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
