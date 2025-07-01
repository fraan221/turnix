import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="max-w-md">
        <Image
          src="/logo.png"
          alt="Logo de Turnix"
          width={100}
          height={100}
          className="mx-auto"
        />
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
          Turnix está llegando.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          La plataforma definitiva para la gestión de tu barbería. Simple, potente y diseñada exclusivamente para ti.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/dashboard">
            <Button>Ingresar al Panel</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Crear Cuenta</Button>
          </Link>
        </div>
        <p className="mt-12 text-xs text-slate-500">
          Actualmente en fase de desarrollo activo.
        </p>
      </div>
    </main>
  );
}