"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { registerBarber } from "@/actions/auth.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import GoogleSignInButton from "./GoogleSignInButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2, Store, Briefcase } from "lucide-react";

const RegisterSchema = z
  .object({
    role: z
      .string()
      .min(1, { message: "Por favor, selecciona un rol." })
      .refine((val) => val === "OWNER" || val === "BARBER", {
        message: "Rol no válido.",
      }),
    name: z
      .string()
      .min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
    barbershopName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email({ message: "Por favor, ingresa un email válido." }),
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
      .regex(/[a-zA-Z]/, { message: "Debe contener al menos una letra." })
      .regex(/\d/, { message: "Debe contener al menos un número." }),
  })
  .superRefine((data, ctx) => {
    if (
      data.role === "OWNER" &&
      (!data.barbershopName || data.barbershopName.length < 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["barbershopName"],
        message: "El nombre de la barbería es requerido.",
      });
    }
  });

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(registerBarber, null);
  const [role, setRole] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Registro exitoso!", { description: state.success });
      setTimeout(() => router.push("/login"), 1500);
    }
    if (state?.error) {
      toast.error("Error en el registro", {
        description: state.error as string,
      });
    }
  }, [state, router]);

  const handleRoleChange = (value: "OWNER" | "BARBER") => {
    setRole(value);
    setValue("role", value, { shouldValidate: true });
  };

  const processForm = (data: RegisterFormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value != null) {
        formData.append(key, String(value));
      }
    });
    formAction(formData);
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
          <CardDescription>
            Ingresa tus datos para empezar a gestionar tu barbería con Turnix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(processForm)} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="role">Primero, ¿cuál es tu rol?</Label>
              <Select onValueChange={handleRoleChange}>
                <SelectTrigger
                  id="role"
                  className={errors.role ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Selecciona tu rol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span>Soy Dueño de la Barbería</span>
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
              <input type="hidden" {...register("role")} />
              {errors.role && (
                <p className="text-xs text-red-500">{errors.role.message}</p>
              )}
            </div>

            <div
              className={`grid gap-4 transition-all duration-300 ease-in-out ${role ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="px-1 overflow-hidden">
                <div className="grid gap-4">
                  {role === "OWNER" && (
                    <div className="grid gap-2">
                      <Label htmlFor="barbershopName">
                        Nombre de tu Barbería
                      </Label>
                      <Input
                        id="barbershopName"
                        {...register("barbershopName")}
                        placeholder="Ej: La Cueva del Barbero"
                      />
                      {errors.barbershopName && (
                        <p className="text-xs text-red-500">
                          {errors.barbershopName.message}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Tu Nombre</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Ej: Juan Pérez"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">
                        {errors.name.message}
                      </p>
                    )}
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
                      <p className="text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <PasswordInput
                      id="password"
                      {...register("password")}
                      autoComplete="new-password"
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !role}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Crear cuenta"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  O registrate con
                </span>
              </div>
            </div>

            <GoogleSignInButton />

            <div className="text-sm text-center">
              ¿Ya tenés una cuenta?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Inicia Sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-xs text-center text-muted-foreground text-balance">
        Al continuar, aceptas nuestra{" "}
        <Link
          href="/terms-of-service"
          target="_blank"
          className="underline underline-offset-4 hover:text-primary"
        >
          Términos de Servicio
        </Link>{" "}
        y{" "}
        <Link
          href="/privacy-policy"
          target="_blank"
          className="underline underline-offset-4 hover:text-primary"
        >
          Política de Privacidad
        </Link>
        .
      </div>
    </div>
  );
}
