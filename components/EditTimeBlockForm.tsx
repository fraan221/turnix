"use client";

import { TimeBlock } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { updateTimeBlock } from "@/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatToDateInput, formatTime } from "@/lib/date-helpers";
import { ArrowLeft, Clock } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Guardando..." : "Guardar cambios"}
    </Button>
  );
}

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
      toast.success("Bloqueo actualizado", {
        description: "Los cambios se guardaron correctamente",
      });
      router.push("/dashboard/schedule");
    }
    if (state?.error) {
      let errorMessage = "No pudimos guardar los cambios. Intentá de nuevo.";
      if (typeof state.error === "string") {
        errorMessage = state.error;
      } else {
        const errorValues = Object.values(state.error).flat();
        if (errorValues.length > 0) {
          errorMessage = errorValues[0] as string;
        }
      }
      toast.error("Error al guardar", { description: errorMessage });
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
    <form action={clientAction} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/schedule">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Volver a horarios</span>
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Editar Bloqueo</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Modificá el período y horario del bloqueo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium">
              Fecha de inicio
            </Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={formatToDateInput(timeBlock.startTime)}
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium">
              Fecha de fin
            </Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={formatToDateInput(timeBlock.endTime)}
              required
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">
            Horario del bloqueo
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-sm font-medium">
              Hora de inicio
            </Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              defaultValue={formatTime(timeBlock.startTime)}
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime" className="text-sm font-medium">
              Hora de fin
            </Label>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              defaultValue={formatTime(timeBlock.endTime)}
              required
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason" className="text-sm font-medium">
          Razón del bloqueo{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="Ej: Vacaciones, evento familiar, feriado"
          defaultValue={timeBlock.reason || ""}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Ayuda a recordar por qué bloqueaste este horario
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Link href="/dashboard/schedule" className="w-full sm:w-auto">
          <Button type="button" variant="outline" className="w-full sm:w-auto">
            Cancelar
          </Button>
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
