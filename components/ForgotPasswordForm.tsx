"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/actions/auth.actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando..." : "Enviar enlace de reseteo"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, dispatch] = useFormState(requestPasswordReset, undefined);

  useEffect(() => {
    if (state?.success) {
    }
  }, [state]);

  return (
    <form action={dispatch} className="space-y-4">
      <div>
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="tu@email.com"
          required
        />
      </div>

      {state?.error && (
        <div
          className="relative px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded"
          role="alert"
        >
          <p>{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div
          className="relative px-4 py-3 text-green-700 bg-green-100 border border-green-400 rounded"
          role="alert"
        >
          <p>{state.success}</p>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
