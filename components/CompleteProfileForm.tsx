"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeGoogleRegistration } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Store, Briefcase } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { User } from "next-auth";
import { useSession } from "next-auth/react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Finalizando..." : "Finalizar Registro"}
    </Button>
  );
}

export default function CompleteProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const { update } = useSession();
  const [state, formAction] = useFormState(completeGoogleRegistration, null);
  const [role, setRole] = useState("");

  const stateRef = useRef(state);

  useEffect(() => {
    if (state !== stateRef.current) {
      stateRef.current = state;

      if (state?.success) {
        toast.success("¡Perfil completado!", {
          description: "Tu cuenta ha sido configurada. Redirigiendo...",
        });

        update(state.updatedData).then(() => {
          router.push("/dashboard");
          router.refresh();
        });
      }

      if (state?.error) {
        toast.error("Error al completar el perfil", {
          description: state.error,
        });
      }
    }
  }, [state, router, update]);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" defaultValue={user.name || ""} disabled />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" defaultValue={user.email || ""} disabled />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="role">¿Cuál es tu rol?</Label>
        <Select name="role" required onValueChange={setRole}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecciona tu rol..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OWNER">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span>Soy Dueño de una Barbería</span>
              </div>
            </SelectItem>
            <SelectItem value="BARBER" disabled>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Soy Barbero / Empleado (Próximamente)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {role && (
        <>
          {role === "OWNER" && (
            <div className="grid gap-2">
              <Label htmlFor="barbershopName">Nombre de tu Barbería</Label>
              <Input
                id="barbershopName"
                name="barbershopName"
                placeholder="Ej: La Cueva del Barbero"
                required
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="phone">Tu Celular (Opcional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Ej: 1122334455"
            />
          </div>

          <SubmitButton />
        </>
      )}
    </form>
  );
}
