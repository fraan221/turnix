"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import {
  refreshSubscriptionStatus,
  reactivateSubscription,
} from "@/actions/subscription.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SubscriptionManagementProps {
  subscription: {
    status: string;
    mercadopagoSubscriptionId: string;
  };
}

export function SubscriptionManagement({
  subscription,
}: SubscriptionManagementProps) {
  const router = useRouter();
  const [isPendingSync, startTransitionSync] = useTransition();

  const handleSync = () => {
    startTransitionSync(async () => {
      const result = await refreshSubscriptionStatus();
      if (result.success) {
        const messages: Record<string, string> = {
          authorized: "Tu pago se procesó correctamente. ¡Tu plan está activo!",
          pending:
            "El pago está pendiente. Podría estar demorado o haber sido rechazado.",
          paused: "Tu suscripción está pausada en Mercado Pago.",
          cancelled:
            "Tu suscripción fue cancelada. Podés reactivarla cuando quieras.",
        };
        const userMessage =
          messages[result.status as string] ||
          `Estado sincronizado: ${result.status}`;

        if (result.status === "authorized") {
          toast.success("Estado actualizado", { description: userMessage });
        } else {
          toast.info("Estado actualizado", { description: userMessage });
        }
        router.refresh();
      } else {
        toast.error("No se pudo actualizar", { description: result.message });
      }
    });
  };

  const handleReactivate = () => {
    startTransitionSync(async () => {
      const result = await reactivateSubscription(
        subscription.mercadopagoSubscriptionId
      );
      if (result.success) {
        toast.success("Suscripción reactivada", {
          description: "Tu plan vuelve a estar activo.",
        });
        router.refresh();
      } else {
        toast.error("No se pudo reactivar", { description: result.error });
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 mx-auto w-full max-w-sm">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isPendingSync}
        className="w-full"
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${isPendingSync ? "animate-spin" : ""}`}
        />
        {isPendingSync ? "Verificando..." : "Verificar estado de pago"}
      </Button>

      {subscription.status === "paused" && (
        <Button
          className="w-full"
          onClick={handleReactivate}
          disabled={isPendingSync}
        >
          {isPendingSync ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Reactivando...
            </>
          ) : (
            "Reactivar suscripción pausada"
          )}
        </Button>
      )}
    </div>
  );
}
