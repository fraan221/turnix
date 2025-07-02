"use client";

import { createService } from "@/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Añadiendo..." : "Añadir Servicio"}
    </Button>
  );
}

export default function ServiceForm() {
  const [state, formAction] = useFormState(createService, null);
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
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre del Servicio</Label>
        <Input id="name" name="name" placeholder="Ej: Corte Fade" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="price">Precio ($)</Label>
        <Input id="price" name="price" type="number" step="0.01" placeholder="Ej: 10.50" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="duration">Duración (minutos)</Label>
        <Input id="duration" name="duration" type="number" placeholder="Ej: 30" required />
      </div>
      <SubmitButton />
    </form>
  );
}
