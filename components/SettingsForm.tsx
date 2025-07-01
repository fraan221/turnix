"use client";

import { User } from "@prisma/client";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { updateUserProfile } from "@/actions/dashboard.actions";
import { useFormState, useFormStatus } from "react-dom";

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

      {state?.error && <p className="text-sm text-center text-red-500">{state.error}</p>}
      {state?.success && <p className="text-sm text-center text-green-500">{state.success}</p>}
    </form>
  );
}