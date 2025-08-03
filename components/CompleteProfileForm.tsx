"use client";

import { useState, useTransition } from "react";
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

type CompleteProfileState = {
  success?: string;
  error?: string;
  fieldErrors?: any;
  updatedData?: { role: "OWNER" | "BARBER"; slug: string | null };
} | null;

export default function CompleteProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const { update } = useSession();
  const [role, setRole] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result: CompleteProfileState = await completeGoogleRegistration(
        null,
        formData
      );

      if (result?.success) {
        toast.success("¡Perfil completado!", {
          description: "Tu cuenta ha sido configurada. Redirigiendo...",
        });

        await update(result.updatedData);
        router.push("/dashboard");
        router.refresh();
      } else if (result?.error) {
        toast.error("Error al completar el perfil", {
          description: result.error,
        });
      }
    });
  };

  return (
    <form action={handleSubmit} className="grid gap-4">
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizando...
              </>
            ) : (
              "Completar registro"
            )}
          </Button>
        </>
      )}
    </form>
  );
}
