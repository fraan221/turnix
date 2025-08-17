import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const features = [
  { name: "Gestión de Agenda Completa", included: true },
  { name: "Creación de Servicios Ilimitados", included: true },
  { name: "Gestión de Horarios y Bloqueos", included: true },
  { name: "Portal de Clientes", included: true },
  { name: "Página Pública con Flujo de Reserva", included: true },
  { name: "Personalización de Perfil", included: true },
  { name: "Gestión de Equipos", included: false },
  { name: "Estadísticas de Negocio", included: false },
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
              {!feature.included && (
                <Badge variant="outline" className="text-primary">
                  Próximamente
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
