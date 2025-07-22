"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetPassword } from "@/actions/auth.actions";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./PasswordInput";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Reseteando..." : "Resetear Contraseña"}
    </Button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, dispatch] = useFormState(resetPassword, undefined);

  useEffect(() => {
    if (state?.success) {
      router.push("/login?resetSuccess=true");
    }
  }, [state, router]);

  return (
    <form action={dispatch} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">Nueva Contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="********"
          required
          autoComplete="new-password"
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          placeholder="********"
          required
          autoComplete="new-password"
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

      <SubmitButton />
    </form>
  );
}
