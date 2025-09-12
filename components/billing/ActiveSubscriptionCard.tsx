"use client";

import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { cancelSubscription } from "@/actions/subscription.actions";
import { formatFullDate } from "@/lib/date-helpers";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ActiveSubscriptionCardProps {
  subscription: {
    mercadopagoSubscriptionId: string;
    currentPeriodEnd: Date;
  };
}

export default function ActiveSubscriptionCard({
  subscription,
}: ActiveSubscriptionCardProps) {
  const [isPending, startTransition] = useTransition();
  const { update } = useSession();

  const handleManagePayment = () => {
    toast.info("Gestión de Pagos", {
      description:
        "Para cambiar tu método de pago, por favor, contacta con soporte para que podamos ayudarte de manera personalizada.",
    });
  };

  const handleCancelSubscription = () => {
    startTransition(async () => {
      const result = await cancelSubscription(
        subscription.mercadopagoSubscriptionId
      );

      if (result.success) {
        toast.success("Suscripción Cancelada", {
          description: result.success,
        });
        await update();
      } else if (result.error) {
        toast.error("Error al cancelar", {
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="max-w-lg p-6 mx-auto ">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold">PLAN PRO ACTIVO</h1>
          <h2 className="text-md text-muted-foreground">
            Tu próximo cobro será el{" "}
            <span className="font-medium text-foreground">
              {formatFullDate(subscription.currentPeriodEnd)}
            </span>
            .
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button variant="secondary" onClick={handleManagePayment}>
            Gestionar medio de pago
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Cancelar Suscripción</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Estás seguro de que quieres cancelar?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Si cancelas, tu acceso al Plan PRO continuará hasta el final
                  de tu ciclo de facturación actual. Podrás reactivar tu
                  suscripción en cualquier momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, mantener suscripción</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelSubscription}
                  disabled={isPending}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Sí, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
