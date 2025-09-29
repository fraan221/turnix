import { ListChecks, Share2, CalendarPlus } from "lucide-react";

const steps = [
  {
    icon: <ListChecks className="w-8 h-8 text-primary" />,
    title: "1. Armá tu perfil",
    description:
      "Cargá tus servicios, precios y horarios. En 5 minutos tenés todo listo.",
  },
  {
    icon: <Share2 className="w-8 h-8 text-primary" />,
    title: "2. Compartí tu link",
    description:
      "Te damos tu página personal. La compartís en Instagram, WhatsApp o donde quieras.",
  },
  {
    icon: <CalendarPlus className="w-8 h-8 text-primary" />,
    title: "3. Recibí turnos automáticamente",
    description:
      "Tus clientes reservan solos, a cualquier hora. Tu agenda se llena sin que hagas nada.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="w-full py-12 bg-background md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter font-heading sm:text-5xl">
              Empezá a recibir turnos hoy mismo
            </h2>
          </div>
        </div>
        <div className="grid items-stretch max-w-5xl gap-6 py-12 mx-auto lg:grid-cols-3 lg:gap-8">
          {steps.map((step) => (
            <div
              key={step.title}
              className="flex flex-col items-center p-6 space-y-4 text-center"
            >
              <div className="flex items-center justify-center p-3 border rounded-full bg-primary/5">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold font-heading">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
