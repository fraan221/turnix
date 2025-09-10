import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const features = [
  { name: "Agenda completa y fácil de usar", included: true },
  { name: "Servicios ilimitados (cortes, barba, etc.)", included: true },
  { name: "Horarios y bloqueos personalizados", included: true },
  { name: "Portal para que tus clientes reserven", included: true },
  { name: "Portal de clientes", included: true },
  { name: "Perfil personalizado con tu marca", included: true },
  { name: "Manejo de equipo de barberos", included: true },
  { name: "Estadísticas de tu negocio", included: true },
];

export function SubscriptionFeatures() {
  return (
    <Card className="max-w-md p-4 mx-auto border rounded-lg border-primary/50">
      <CardHeader>
        <CardTitle className="text-center font-heading">Plan PRO</CardTitle>
      </CardHeader>
      <CardContent className="max-w-md mx-auto">
        <ul className="space-y-4">
          {features.map((feature) => (
            <li key={feature.name} className="flex items-center gap-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 shrink-0">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="flex-1">{feature.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
