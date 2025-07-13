import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Scissors, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-primary" />,
      title: "Agenda Visual",
      description:
        "Gestiona todos tus turnos en un calendario simple e intuitivo, diseñado para evitar superposiciones y organizar tu día.",
    },
    {
      icon: <Scissors className="w-8 h-8 text-primary" />,
      title: "Gestión de Servicios",
      description:
        "Crea y personaliza tu lista de servicios, establece precios y duraciones para que tus clientes sepan exactamente qué ofreces.",
    },
    {
      icon: <Globe className="w-8 h-8 text-primary" />,
      title: "Página Pública para Clientes",
      description:
        "Recibe un enlace único para que tus clientes puedan ver tus servicios y agendar un turno online.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <section className="w-full py-12 text-center md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center gap-4">
              <Image
                src="/logo.png"
                alt="Logo de Turnix"
                width={120}
                height={120}
                className="mb-4"
              />
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Turnix
              </h1>
              <h2 className="text-xl font-bold tracking-tighter sm:text-2xl md:text-3xl lg:text-4xl">
                La herramienta definitiva para tu barbería
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Simplifica tu día, maneja tus turnos y permití que tus clientes
                reserven online.
              </p>
              <div className="flex flex-col gap-4 lg:flex-row">
                <Link href="/register">
                  <Button size="lg">Empezar Gratis</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 bg-muted/40 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block px-3 py-1 text-sm rounded-lg bg-primary/10 text-primary">
                  Características Principales
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Todo lo que necesitas, en un solo lugar
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Turnix está diseñado para ser potente pero simple, centrándose
                  en las herramientas que realmente importan.
                </p>
              </div>
            </div>
            <div className="grid items-start max-w-5xl gap-6 py-12 mx-auto lg:grid-cols-3 lg:gap-12">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader className="flex flex-col items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-center text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                ¿Listo para simplificar tu barbería?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Unite a los miles de barberos que gestionan su negocio de forma
                inteligente.
              </p>
            </div>
            <div className="w-full max-w-sm mx-auto space-y-2">
              <Link href="/register">
                <Button size="lg" className="w-full">
                  Empezar Ahora
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 text-xs text-center border-t text-muted-foreground">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p>
            © {new Date().getFullYear()} Turnix. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-primary">
              Política de Privacidad
            </Link>
            <Link href="/cookie-policy" className="hover:text-primary">
              Política de Cookies
            </Link>
            <Link href="/terms-of-service" className="hover:text-primary">
              Términos de Servicio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
