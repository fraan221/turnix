"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createSubscription } from "@/actions/subscription.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag } from "lucide-react";
import { useSearchParams } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirigiendo a Mercado Pago...
        </>
      ) : (
        <>
          <ShoppingBag />
          Suscribirme al Plan PRO
        </>
      )}
    </Button>
  );
}

export default function SubscribePage() {
  const [state, formAction] = useFormState(createSubscription, {});
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const isProactiveSubscription = reason === "trial";

  useEffect(() => {
    if (state?.error) {
      toast.error("Error al crear la suscripción", {
        description: state.error,
      });
    }
    if (state?.init_point) {
      window.location.href = state.init_point;
    }
  }, [state]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
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
          <form action={formAction}>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
