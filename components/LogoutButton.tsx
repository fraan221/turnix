"use client";

import { useFormStatus } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth.actions";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  children?: React.ReactNode;
}

export function LogoutButton({
  className,
  variant = "outline",
  children,
}: LogoutButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      variant={variant}
      className={cn("w-full", className)}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Cerrando sesión...
        </>
      ) : (
        children || (
          <>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </>
        )
      )}
    </Button>
  );
}

export function LogoutForm({
  className,
  variant,
  children,
}: LogoutButtonProps) {
  return (
    <form action={logoutAction} className={className}>
      <LogoutButton variant={variant}>{children}</LogoutButton>
    </form>
  );
}
