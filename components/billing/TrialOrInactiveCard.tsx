"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createSubscription } from "@/actions/subscription.actions";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag } from "lucide-react";
import { intervalToDuration } from "date-fns";

interface TrialOrInactiveCardProps {
  user: {
    trialEndsAt: Date | null;
  };
}

function SubmitButton({ isTrial }: { isTrial: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-auto" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirigiendo...
        </>
      ) : isTrial ? (
        <>
          <ShoppingBag />
          Suscribirse
        </>
      ) : (
        <>
          <ShoppingBag />
          Reactivar Suscripción PRO
        </>
      )}
    </Button>
  );
}

export default function TrialOrInactiveCard({
  user,
}: TrialOrInactiveCardProps) {
  const [state, formAction] = useFormState(createSubscription, {});
  const [timeLeft, setTimeLeft] = useState("");
  const isInTrial = user.trialEndsAt && user.trialEndsAt > new Date();

  useEffect(() => {
    if (!user.trialEndsAt || new Date() > new Date(user.trialEndsAt)) return;

    const intervalId = setInterval(() => {
      const duration = intervalToDuration({
        start: new Date(),
        end: new Date(user.trialEndsAt!),
      });

      const days = duration.days || 0;
      const hours = duration.hours || 0;
      const minutes = duration.minutes || 0;
      const seconds = duration.seconds || 0;

      setTimeLeft(`${days} días ${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [user.trialEndsAt]);

  useEffect(() => {
    if (state?.error) {
      toast.error("Error", { description: state.error });
    }
    if (state?.init_point) {
      window.location.href = state.init_point;
    }
  }, [state]);

  return (
    <div className="p-6">
      <div className="space-y-4 text-center">
        {isInTrial ? (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              ¡Asegura tu acceso al Plan PRO!
            </h3>
            <p className="text-muted-foreground">
              Tu prueba gratuita termina en:
            </p>
            <div className="flex items-center justify-center">
              <span className="px-3 py-2 font-mono text-xl font-bold rounded-lg bg-primary/10 text-primary">
                {timeLeft}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold">
              Tu suscripción no está activa
            </h3>
            <p className="text-muted-foreground">
              Reactiva tu Plan PRO para seguir gestionando tu barbería sin
              límites.
            </p>
          </div>
        )}

        <form action={formAction}>
          <SubmitButton isTrial={!!isInTrial} />
        </form>
      </div>
    </div>
  );
}
