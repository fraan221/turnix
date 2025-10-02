import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const features = [
  { name: "Agenda completa y fácil de usar", included: true },
  { name: "Servicios ilimitados", included: true },
  { name: "Horarios y bloqueos personalizados", included: true },
  { name: "Portal para que tus clientes reserven", included: true },
  { name: "Gestión de equipo", included: true },
  { name: "Estadísticas de negocio", included: true },
  { name: "Página web propia", included: true },
  { name: "Perfil con tu marca", included: true },
];

export function SubscriptionFeatures({ price }: { price: number }) {
  return (
    <Card className="w-full border rounded-lg">
      <CardHeader className="pb-4">
        <div className="space-y-1 text-center">
          <CardTitle className="text-xl font-heading">Plan PRO</CardTitle>
        </div>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold tracking-tight">${price}</span>
          <span className="text-lg text-muted-foreground">/mes</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="pt-4 border-t">
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature.name} className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded-full w-5 h-5 bg-primary/10 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="flex-1 text-sm leading-relaxed">
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
