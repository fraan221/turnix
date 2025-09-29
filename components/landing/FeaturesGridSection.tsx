import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { CalendarClock, LineChart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: <WhatsAppIcon className="w-8 h-8 text-primary" />,
    title: "Libérate del Caos de WhatsApp",
    description:
      "Tu agenda se llena sola mientras duermes. Los clientes reservan 24/7 sin interrumpirte, y los recordatorios automáticos reducen las ausencias.",
    className: "lg:col-span-2",
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: "Organiza a tu Equipo",
    description:
      "Cada barbero con su agenda, sus servicios y sus clientes. Todo sincronizado en un solo lugar. Menos confusiones, más productividad.",
    className: "lg:row-span-2",
  },
  {
    icon: <LineChart className="w-8 h-8 text-primary" />,
    title: "Entiende tu Negocio",
    description:
      "Descubre qué servicios te dan más plata, qué clientes vuelven más y en qué horarios facturas mejor. Decisiones con datos, no con intuición.",
    className: "",
  },
  {
    icon: <CalendarClock className="w-8 h-8 text-primary" />,
    title: "Una Agenda Inteligente",
    description:
      "Adiós a los cuadernos y las notas en el celular. Ten una visión clara de tu día, semana y mes. Simple, visual y siempre a mano.",
    className: "",
  },
];

export function FeaturesGridSection() {
  return (
    <section
      id="beneficios"
      className="w-full py-12 bg-muted/40 md:py-24 lg:py-32"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter font-heading sm:text-5xl">
              ¿La Barber? En piloto automático
            </h2>
          </div>
        </div>
        <div className="grid max-w-5xl gap-6 py-12 mx-auto lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className={cn("flex flex-col", feature.className)}
            >
              <CardHeader className="flex flex-row items-center justify-center gap-4 text-center">
                {feature.icon}
                <CardTitle className="mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow text-center">
                <p className="text-md text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
