"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2, CalendarX } from "lucide-react";
import { createTimeBlock } from "@/actions/dashboard.actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface AddTimeBlockModalContentProps {
  onClose: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto min-w-[160px]"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Bloqueando...
        </>
      ) : (
        "Bloquear Horario"
      )}
    </Button>
  );
}

export function AddTimeBlockModalContent({
  onClose,
}: AddTimeBlockModalContentProps) {
  const [state, formAction] = useFormState(createTimeBlock, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Horario bloqueado!", {
        description: "Los clientes no podrán reservar en este período.",
      });
      formRef.current?.reset();
      onClose();
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
      toast.error("No se pudo bloquear el horario", {
        description: errorMessage,
      });
    }
  }, [state, onClose]);

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
    <>
      <DialogHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <CalendarX className="w-5 h-5 text-destructive" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl">
            Bloquear Horario
          </DialogTitle>
        </div>
        <DialogDescription className="text-sm text-muted-foreground">
          Definí un período en el que no estarás disponible para atender
          clientes
        </DialogDescription>
      </DialogHeader>

      <form ref={formRef} action={clientAction} className="py-4 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium">
              Fecha de inicio
            </Label>
            <Input id="startDate" name="startDate" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium">
              Fecha de fin
            </Label>
            <Input id="endDate" name="endDate" type="date" required />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-sm font-medium">
              Hora de inicio
            </Label>
            <Input id="startTime" name="startTime" type="time" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime" className="text-sm font-medium">
              Hora de fin
            </Label>
            <Input id="endTime" name="endTime" type="time" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason" className="text-sm font-medium">
            Razón{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Input
            id="reason"
            name="reason"
            placeholder="Ej: Vacaciones, día libre, evento personal"
          />
        </div>

        <div className="p-3 border rounded-lg bg-muted/50 border-muted-foreground/10">
          <p className="text-xs leading-relaxed text-muted-foreground">
            💡 Tip: Durante este período, los clientes no podrán reservar turnos
            en tu agenda
          </p>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </DialogClose>
          <SubmitButton />
        </DialogFooter>
      </form>
    </>
  );
}
