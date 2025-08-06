"use client";

import { TimeBlock } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { updateTimeBlock } from "@/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar Cambios"}
    </Button>
  );
}

const formatDateForInput = (date: Date) => format(new Date(date), "yyyy-MM-dd");
const formatTimeForInput = (date: Date) => format(new Date(date), "HH:mm");

export default function EditTimeBlockForm({
  timeBlock,
}: {
  timeBlock: TimeBlock;
}) {
  const router = useRouter();
  const updateTimeBlockWithId = updateTimeBlock.bind(null, timeBlock.id);
  const [state, formAction] = useFormState(updateTimeBlockWithId, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Éxito!", { description: state.success });
      router.push("/dashboard/schedule");
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
      toast.error("Error", { description: errorMessage });
    }
  }, [state, router]);

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
    <form action={clientAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Fecha de Inicio</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={formatDateForInput(timeBlock.startTime)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Fecha de Fin</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={formatDateForInput(timeBlock.endTime)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Hora de Inicio</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue={formatTimeForInput(timeBlock.startTime)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Hora de Fin</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            defaultValue={formatTimeForInput(timeBlock.endTime)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Razón (Opcional)</Label>
        <Input
          id="reason"
          name="reason"
          placeholder="Ej: Vacaciones, Feriado"
          defaultValue={timeBlock.reason || ""}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Link href="/dashboard/schedule">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
