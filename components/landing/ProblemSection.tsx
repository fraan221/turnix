import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BarChart2 } from "lucide-react";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

const painPoints = [
  {
    icon: <WhatsAppIcon className="w-8 h-8 text-primary" />,
    title: "El caos con WhatsApp",
    description:
      "Mensajes a cualquier hora, clientes que faltan sin avisar. Tu celular lleno de mensajes y vos corrés para acomodar todo.",
  },
  {
    icon: <Calendar className="w-8 h-8 text-primary" />,
    title: "Las agendas que no funcionan",
    description:
      "Cuaderno, notas en el celu, mensajes guardados. Tenés tres sistemas diferentes y ninguno te da lo que necesitas.",
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-primary" />,
    title: "Estas a ciegas con tu negocio",
    description:
      "No tenes forma medible de saber si ganaste más que el mes pasado, qué servicios te dan más plata, o cuáles clientes valen la pena.",
  },
];

export function ProblemSection() {
  return (
    <section className="w-full py-12 bg-muted/40 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter font-heading sm:text-5xl">
              Tu rutina de siempre
            </h2>
          </div>
        </div>
        <div className="grid items-start max-w-5xl gap-6 py-12 mx-auto lg:grid-cols-3 lg:gap-12">
          {painPoints.map((point) => (
            <Card key={point.title}>
              <CardHeader className="flex flex-col items-center text-center">
                {point.icon}
                <CardTitle className="mt-4">{point.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center text-muted-foreground">
                  {point.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
