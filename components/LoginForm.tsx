"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import GoogleSignInButton from "./GoogleSignInButton";
import { PasswordInput } from "./PasswordInput";

const LOGIN_ERROR_MESSAGES: { [key: string]: string } = {
  CredentialsSignin:
    "El email o la contraseña son incorrectos. Por favor, verifica tus datos.",
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        const errorMessage =
          LOGIN_ERROR_MESSAGES[result.error] ||
          "Ocurrió un error inesperado. Intenta de nuevo.";
        setError(errorMessage);
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Inicia Sesión</CardTitle>
          {/* <CardDescription>Ingresa con tu cuenta de Google</CardDescription> */}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Error al Iniciar Sesión</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-4">
                <GoogleSignInButton />
              </div>

              <div className="relative text-sm text-center after:border-border after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="relative z-10 px-2 bg-card text-muted-foreground">
                  O continúa con
                </span>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link
                      href="/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <PasswordInput
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </div>
              <div className="text-sm text-center">
                ¿No tenés una cuenta?{" "}
                <Link
                  href="/register"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Regístrate
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-xs text-center text-muted-foreground text-balance">
        Al continuar, aceptas nuestros{" "}
        <Link
          href="/terms-of-service"
          target="_blank"
          className="underline underline-offset-2 hover:text-primary"
        >
          Términos de Servicio
        </Link>{" "}
        y{" "}
        <Link
          href="/privacy-policy"
          target="_blank"
          className="underline underline-offset-2 hover:text-primary"
        >
          Política de Privacidad
        </Link>
        .
      </div>
    </div>
  );
}
