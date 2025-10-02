"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createSubscription } from "@/actions/subscription.actions";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";

function SubmitButton({ isTrial }: { isTrial: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirigiendo a Mercado Pago...
        </>
      ) : isTrial ? (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Suscribirme al Plan PRO
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Reactivar mi Plan PRO
        </>
      )}
    </Button>
  );
}

export default function SubscriptionButton({
  isTrial,
  discountCode,
}: {
  isTrial: boolean;
  discountCode?: string | null;
}) {
  const [state, formAction] = useFormState(createSubscription, {});

  useEffect(() => {
    if (state?.error) {
      toast.error("No pudimos procesar el pago", {
        description: state.error,
      });
    }
    if (state?.init_point) {
      toast.loading("Redirigiendo a Mercado Pago...", {
        description: "Estás siendo redirigido al checkout seguro",
      });
      window.location.href = state.init_point;
    }
  }, [state]);

  return (
    <form action={formAction} className="w-full">
      {discountCode && (
        <input type="hidden" name="discountCode" value={discountCode} />
      )}
      <SubmitButton isTrial={isTrial} />
    </form>
  );
}
