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
import { Loader2, Sparkles, CreditCard, Calendar } from "lucide-react";

interface ActiveSubscriptionCardProps {
  subscription: {
    mercadopagoSubscriptionId: string;
    currentPeriodEnd: Date;
    discountedUntil?: Date | null;
    discountCode?: {
      overridePrice: number;
    } | null;
  };
}

export default function ActiveSubscriptionCard({
  subscription,
}: ActiveSubscriptionCardProps) {
  const [isPending, startTransition] = useTransition();
  const { update } = useSession();

  const handleManagePayment = () => {
    toast.info("Cambiar medio de pago", {
      description:
        "Escribinos por WhatsApp y te ayudamos a cambiar tu método de pago en minutos.",
    });
  };

  const handleCancelSubscription = () => {
    startTransition(async () => {
      const result = await cancelSubscription(
        subscription.mercadopagoSubscriptionId
      );
      if (result.success) {
        toast.success("Suscripción cancelada", { description: result.success });
        await update();
      } else if (result.error) {
        toast.error("No pudimos cancelar", { description: result.error });
      }
    });
  };

  const standardPrice = 9900;
  const isDiscountActive =
    subscription.discountedUntil &&
    new Date(subscription.discountedUntil) > new Date();

  return (
    <div className="max-w-2xl p-6 mx-auto border rounded-lg bg-card">
      <div className="space-y-6">
        <div className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Plan PRO</h2>
              <p className="text-sm text-muted-foreground">
                Suscripción activa
              </p>
            </div>
            <div className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
              Activo
            </div>
          </div>
        </div>

        {isDiscountActive && subscription.discountCode ? (
          <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Descuento especial activo
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Estás pagando{" "}
                  <span className="font-bold text-foreground">
                    ${subscription.discountCode.overridePrice}/mes
                  </span>{" "}
                  hasta el{" "}
                  <span className="font-medium text-foreground">
                    {formatFullDate(subscription.discountedUntil!)}
                  </span>
                  .
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Después de esa fecha, el precio será ${standardPrice}/mes.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Calendar className="w-5 h-5 mt-0.5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Próximo cobro
            </h3>
            <p className="mt-1 text-lg font-semibold">
              {formatFullDate(subscription.currentPeriodEnd)}
            </p>
            {!isDiscountActive && (
              <p className="mt-1 text-sm text-muted-foreground">
                ${standardPrice}/mes
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 space-y-3 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleManagePayment}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Cambiar medio de pago
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-muted-foreground">
                Cancelar suscripción
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Seguro que querés cancelar?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Si cancelás ahora, tu Plan PRO seguirá activo hasta el{" "}
                  {formatFullDate(subscription.currentPeriodEnd)}. Después de
                  esa fecha perderás acceso a todas las funcionalidades.
                  <br />
                  <br />
                  Podés reactivar tu suscripción cuando quieras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Mantener suscripción</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelSubscription}
                  disabled={isPending}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Cancelar Plan PRO
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
