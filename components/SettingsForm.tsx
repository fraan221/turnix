"use client";

import { User } from "@prisma/client";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { updateUserProfile } from "@/actions/dashboard.actions";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useEffect } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Guardando..." : "Guardar Cambios"}
    </Button>
  );
}

export default function SettingsForm({ user }: { user: User }) {
  const [state, formAction] = useFormState(updateUserProfile, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Perfil Actualizado!", {
        description: state.success,
      });
    }
    if (state?.error) {
      toast.error("Error al guardar", {
        description: state.error,
      });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Tu Nombre</Label>
        <Input id="name" name="name" defaultValue={user.name || ""} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="barbershopName">Nombre de tu Barbería (Opcional)</Label>
        <Input id="barbershopName" name="barbershopName" defaultValue={user.barbershopName || ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Tu URL Personalizada</Label>
        <div className="flex items-center">
          <span className="p-2 text-sm border border-r-0 bg-slate-100 rounded-l-md">turnix.app/</span>
          <Input id="slug" name="slug" className="rounded-l-none" defaultValue={user.slug || ""} required />
        </div>
      </div>
      
      <SubmitButton />
    </form>
  );
}
