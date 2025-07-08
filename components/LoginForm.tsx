"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react"; 
import GoogleSignInButton from "./GoogleSignInButton";

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
        setError("Credenciales inválidas. Por favor, intenta de nuevo.");
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Error al Iniciar Sesión</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading} 
          />
        </div>

        <div className="px-1 pt-2 text-xs text-center text-muted-foreground">
          Al continuar, aceptas nuestra{' '}
          <Link href="/privacy-policy" className="underline hover:text-primary" target="_blank">
            Política de Privacidad
          </Link>
          .
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2 bg-background text-muted-foreground">O continúa con</span>
        </div>
      </div>

      <GoogleSignInButton />

      <div className="mt-4 text-sm text-center">
        ¿No tienes una cuenta?{" "}
        <Link href="/register" passHref legacyBehavior>
          <Button asChild variant="link">
            <a>Regístrate</a>
          </Button>
        </Link>
      </div>
    </div>
  );
}