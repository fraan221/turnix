import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

const features = [
  "Agenda completa y fácil de usar",
  "Servicios ilimitados (cortes, barba, etc.)",
  "Horarios y bloqueos personalizados",
  "Portal de clientes",
  "Manejo de equipo de barberos",
  "Estadísticas de tu negocio",
  "Portal para que tus clientes reserven",
  "Perfil personalizado con tu marca",
];

export function PricingSection() {
  return (
    <section
      id="precios"
      className="w-full py-12 bg-muted/40 md:py-24 lg:py-32"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter font-heading sm:text-5xl">
              Un plan simple, sin sorpresas
            </h2>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Card className="w-full max-w-md border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold font-heading">
                PLAN PRO
              </CardTitle>
              <div className="flex items-baseline justify-center gap-2 font-heading">
                <span className="text-4xl font-bold">$9.900</span>
                <span className="text-muted-foreground">ARS/mes</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex items-center justify-center bg-green-100 rounded-full w-7 h-7">
                      <Check className="w-4 h-4 stroke-green-600" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button asChild size="lg" className="w-full">
                <Link href="/register">Empezar mis 14 días gratis</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Podes empezar sin tarjeta de crédito.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
