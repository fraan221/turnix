"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/actions/auth.actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Check, Loader2, ArrowLeft } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Enviando...
        </>
      ) : (
        "Enviar enlace de recuperación"
      )}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, dispatch] = useFormState(requestPasswordReset, undefined);

  if (state?.success) {
    return (
      <div className={cn("flex flex-col gap-6")}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">¡Correo enviado!</CardTitle>
            <CardDescription>
              {state.success}
              <br />
              Revisa tu bandeja de entrada (y spam) para continuar.
            </CardDescription>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/login">Volver a Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
          <CardDescription>
            Ingresá tu email y te enviaremos un enlace para restablecer tu
            acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="tu@email.com"
                required
                className={state?.error ? "border-red-500" : ""}
              />
            </div>

            {state?.error && (
              <div className="p-3 text-sm text-center text-red-600 bg-red-100 border border-red-200 rounded-md">
                {state.error}
              </div>
            )}

            <SubmitButton />

            <div className="text-sm text-center">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 transition-colors text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
