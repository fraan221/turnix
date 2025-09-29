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
    title: "Dejá de vivir en WhatsApp",
    description:
      "Tu agenda se llena sola 24/7. Los clientes reservan sin molestarte y los mensajes por WhatsApp llegan solos.",
    className: "lg:col-span-2",
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: "Tu equipo sincronizado",
    description:
      "Cada barbero con su propia agenda y servicios. Todo organizado en un solo lugar, sin confusiones ni superposiciones.",
    className: "lg:row-span-2",
  },
  {
    icon: <LineChart className="w-8 h-8 text-primary" />,
    title: "Datos que generan valor",
    description:
      "Qué servicios generan más, qué clientes vuelven y cuándo facturás mejor. Decisiones inteligentes con información real.",
    className: "",
  },
  {
    icon: <CalendarClock className="w-8 h-8 text-primary" />,
    title: "Agenda visual y clara",
    description:
      "Olvidate de cuadernos y notas en el celu. Tu día, semana y mes en una sola vista. Simple y siempre disponible.",
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
