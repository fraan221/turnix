import { Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionInactivePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="items-center">
          <div className="p-3 mb-4 rounded-full bg-primary/10">
            <Pause className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">
            Tu cuenta está pausada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            No podés acceder al panel porque la suscripción de tu barbería se
            venció.
          </p>
          <p className="text-muted-foreground">
            Hablá con el dueño para que reactive el Plan PRO y vuelvas a
            gestionar tus turnos normalmente.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Mientras tanto, podés cerrar esta ventana y volver más tarde cuando
            esté todo solucionado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
