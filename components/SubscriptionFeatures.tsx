import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { BILLING_PERIODS } from "@/lib/mercadopago/subscription-types";

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

export function SubscriptionFeatures({
  price,
  originalPrice,
  billingPeriod,
  totalAnnual,
}: {
  price: number;
  originalPrice?: number;
  billingPeriod?: string;
  totalAnnual?: number;
}) {
  return (
    <Card className="overflow-hidden w-full rounded-lg border">
      <CardHeader className="relative pb-4 bg-primary/5">
        <div className="space-y-1 text-center">
          <CardTitle className="text-xl font-heading">
            Plan PRO {billingPeriod === BILLING_PERIODS.ANNUAL ? "Anual" : ""}
          </CardTitle>
        </div>
        <div className="flex flex-col justify-center items-center">
          {originalPrice && (
            <span className="mb-1 text-sm line-through text-muted-foreground">
              ${originalPrice.toLocaleString("es-AR")}
            </span>
          )}
          <div className="flex gap-1 justify-center items-baseline">
            <span className="text-4xl font-bold tracking-tight">
              ${price.toLocaleString("es-AR")}
            </span>
            <span className="text-lg text-muted-foreground">/mes</span>
          </div>

        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature.name} className="flex gap-3 items-start">
              <div className="flex items-center justify-center rounded-full w-5 h-5 bg-primary/10 shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="flex-1 text-sm leading-relaxed">
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
