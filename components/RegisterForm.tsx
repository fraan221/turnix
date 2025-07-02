"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerBarber } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

function SubmitButton() {
     const { pending } = useFormStatus();
     return (
     <Button type="submit" className="w-full" disabled={pending}>
     {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
     ) : (
          "Crear Cuenta"
     )}
     </Button>
     );
}

export default function RegisterForm() {
     const router = useRouter();
     const [state, formAction] = useFormState(registerBarber, null);

     useEffect(() => {
     if (state?.success) {
     toast.success("¡Registro exitoso!", {
          description: state.success,
     });
     
     setTimeout(() => {
          router.push("/login");
     }, 1500);
     }
     if (state?.error) {
     toast.error("Error en el registro", {
          description: state.error,
     });
     }
     }, [state, router]);

     return (
     <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
               <Label htmlFor="name">Nombre</Label>
               <Input id="name" name="name" placeholder="Ej: Juan Pérez" required />
          </div>
          <div className="grid gap-2">
               <Label htmlFor="barbershopName">Nombre de tu Barbería (Opcional)</Label>
               <Input id="barbershopName" name="barbershopName" placeholder="Ej: La Cueva del Barbero" />
          </div>
          <div className="grid gap-2">
               <Label htmlFor="email">Email</Label>
               <Input
               id="email"
               name="email"
               type="email"
               placeholder="tu@email.com"
               required
               />
          </div>
          <div className="grid gap-2">
               <Label htmlFor="password">Contraseña</Label>
               <Input id="password" name="password" type="password" required />
          </div>
          <SubmitButton />
     </form>
     );
}
