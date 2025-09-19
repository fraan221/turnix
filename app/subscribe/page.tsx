"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isProactiveSubscription
              ? "¡Continuá sin interrupciones!"
              : "Tu prueba gratuita terminó"}
          </CardTitle>
          <CardDescription className="max-w-xs mx-auto text-muted-foreground">
            {isProactiveSubscription
              ? "Suscríbete ahora y seguí gestionando tu barbería sin perder ni un turno."
              : "Suscríbete al Plan PRO para recuperar el acceso a todos tus datos y turnos."}
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
