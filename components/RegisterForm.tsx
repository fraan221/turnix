"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerBarber } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import GoogleSignInButton from "./GoogleSignInButton";
import Link from "next/link";
import { PasswordInput } from "./PasswordInput";

const RegisterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  barbershopName: z.string().optional(),
  email: z.string().email({ message: "Por favor, ingresa un email válido." }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { message: "Debe contener al menos una letra." })
    .regex(/\d/, { message: "Debe contener al menos un número." }),
});

type RegisterFormValues = z.infer<typeof RegisterSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Cuenta"}
    </Button>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(registerBarber, null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Registro exitoso!", { description: state.success });
      setTimeout(() => router.push("/login"), 1500);
    }
    if (state?.error && !state.fieldErrors) {
      toast.error("Error en el registro", { description: state.error });
    }
  }, [state, router]);

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        onSubmit={handleSubmit(() =>
          formAction(new FormData(document.querySelector("form")!))
        )}
        className="grid gap-4"
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" {...register("name")} placeholder="Ej: Juan Pérez" />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="barbershopName">
            Nombre de tu Barbería (Opcional)
          </Label>
          <Input
            id="barbershopName"
            {...register("barbershopName")}
            placeholder="Ej: La Cueva del Barbero"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="tu@email.com"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput id="password" {...register("password")} />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="px-1 pt-2 text-xs text-center text-muted-foreground">
          Al continuar, aceptas nuestra{" "}
          <Link
            href="/privacy-policy"
            className="underline hover:text-primary"
            target="_blank"
          >
            Política de Privacidad
          </Link>{" "}
          y nuestros{" "}
          <Link
            href="/terms-of-service"
            className="underline hover:text-primary"
            target="_blank"
          >
            Términos de Servicio
          </Link>
          .
        </div>

        <SubmitButton />
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2 bg-background text-muted-foreground">
            O regístrate con
          </span>
        </div>
      </div>

      <GoogleSignInButton />
    </div>
  );
}
