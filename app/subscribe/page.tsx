"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { SubscriptionFeatures } from "@/components/SubscriptionFeatures";
import SubscriptionButton from "@/components/billing/SubscriptionButton";

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const isProactiveSubscription = reason === "trial";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isProactiveSubscription
              ? "¡Asegura tu acceso al Plan PRO!"
              : "Tu período de prueba ha terminado..."}
          </CardTitle>
          <CardDescription>
            {isProactiveSubscription
              ? "Continúa sin interrupciones cuando finalice tu prueba suscribiéndote a nuestro Plan PRO."
              : "Para seguir utilizando todas las funciones de Turnix, por favor, suscríbete."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <SubscriptionFeatures />
            <SubscriptionButton isTrial={isProactiveSubscription} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
