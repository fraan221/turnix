"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createSubscription } from "@/actions/subscription.actions";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag } from "lucide-react";

function SubmitButton({ isTrial }: { isTrial: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-auto" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Procesando pago...
        </>
      ) : isTrial ? (
        <>
          <ShoppingBag className="mr-2" />
          Continuar con Plan PRO
        </>
      ) : (
        <>
          <ShoppingBag className="mr-2" />
          Reactivar Plan PRO
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
      toast.error("Error", { description: state.error });
    }
    if (state?.init_point) {
      window.location.href = state.init_point;
    }
  }, [state]);

  return (
    <form action={formAction}>
      {discountCode && (
        <input type="hidden" name="discountCode" value={discountCode} />
      )}
      <SubmitButton isTrial={isTrial} />
    </form>
  );
}
