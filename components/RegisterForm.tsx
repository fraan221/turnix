"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
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
import { Loader2, Store, Briefcase, Check } from "lucide-react";
import { useLoader } from "@/context/LoaderContext";

const RegisterSchema = z
  .object({
    role: z.enum(["OWNER", "BARBER"], {
      message: "Por favor, selecciona un rol.",
    }),
    name: z
      .string()
      .min(3, { message: "El nombre debe tener al menos 3 caracteres." })
      .max(50, { message: "El nombre no puede exceder los 50 caracteres." }),
    barbershopName: z
      .string()
      .max(50, {
        message: "El nombre de la barbería no puede exceder los 50 caracteres.",
      })
      .optional(),
    phone: z.string(),
    email: z.string().email({ message: "Por favor, ingresa un email válido." }),
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
      .regex(/[a-zA-Z]/, { message: "Debe contener al menos una letra." })
      .regex(/\d/, { message: "Debe contener al menos un número." })
      .regex(/[^A-Za-z0-9]/, {
        message:
          "La contraseña debe contener al menos un símbolo (ej: !@#$%*).",
      }),
  })
  .superRefine((data, ctx) => {
    if (
      data.role === "OWNER" &&
      (!data.barbershopName || data.barbershopName.trim().length < 3)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["barbershopName"],
        message: "El nombre de la barbería debe tener al menos 3 caracteres.",
      });
    }

    if (!data.phone || data.phone.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "El número de celular es requerido.",
      });
    } else {
      const cleanedPhone = data.phone.replace(/[\s-()]/g, "");
      if (!/^[0-9]+$/.test(cleanedPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "El teléfono solo puede contener números.",
        });
      } else if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "El teléfono debe tener entre 8 y 15 dígitos.",
        });
      }
    }
  });

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(registerBarber, null);
  const [role, setRole] = useState<string | null>(null);
  const { showLoader, hideLoader } = useLoader();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (state?.success) {
      setIsSuccess(true);
      hideLoader();
      setTimeout(() => router.push("/login"), 2500);
    }

    if (state?.error) {
      const fieldErrors = state.fieldErrors as Record<string, string[]>;
      if (fieldErrors) {
        for (const field in fieldErrors) {
          setError(field as keyof RegisterFormValues, {
            type: "server",
            message: fieldErrors[field][0],
          });
        }
      } else if (typeof state.error === "string") {
        setError("root.serverError", {
          type: "server",
          message: state.error,
        });
      }
      hideLoader();
    }
  }, [state, router, setError, hideLoader]);

  const handleRoleChange = (value: "OWNER" | "BARBER") => {
    setRole(value);
    setValue("role", value, { shouldValidate: true });
  };

  const processForm = (data: RegisterFormValues) => {
    showLoader("Creando cuenta... Un momento.");
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
        {isSuccess ? (
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Listo! Ya podés empezar</CardTitle>
            <CardDescription>
              Tu cuenta ya está lista. Te llevamos al login para que puedas
              acceder a tu panel de barbero.
            </CardDescription>
          </CardContent>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
              <CardDescription>
                Completá estos datos y empezá a gestionar tu barbería en minutos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(processForm)} className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="role">¿Cuál es tu situación?</Label>
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
                          <span>Soy el Dueño de la Barbería</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="BARBER">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>Soy un Barbero / Empleado</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" {...register("role")} />
                  {errors.role && (
                    <p className="text-xs text-red-500">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                <div
                  className={`grid gap-4 transition-all duration-300 ease-in-out ${role ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="px-1 py-1 overflow-hidden">
                    <div className="grid gap-4">
                      {role === "OWNER" && (
                        <div className="grid gap-2">
                          <Label htmlFor="barbershopName">
                            Nombre de tu Barbería{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="barbershopName"
                            {...register("barbershopName")}
                          />
                          {errors.barbershopName && (
                            <p className="text-xs text-red-500">
                              {errors.barbershopName.message}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid gap-2">
                        <Label htmlFor="name">
                          Tu Nombre <span className="text-red-500">*</span>
                        </Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && (
                          <p className="text-xs text-red-500">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phone">
                          Tu Celular <span className="text-red-500">*</span>
                        </Label>
                        <Input id="phone" type="tel" {...register("phone")} />
                        {errors.phone && (
                          <p className="text-xs text-red-500">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input id="email" type="email" {...register("email")} />
                        {errors.email && (
                          <p className="text-xs text-red-500">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="password">
                          Contraseña <span className="text-red-500">*</span>
                        </Label>
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

                {errors.root?.serverError && (
                  <div className="p-2 text-sm text-center text-red-600 bg-red-100 border border-red-200 rounded-md">
                    {errors.root.serverError.message}
                  </div>
                )}

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
                      O creá tu cuenta con
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
          </>
        )}
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
