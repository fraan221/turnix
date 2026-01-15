"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Crown,
  RefreshCw,
  Calendar,
  Sparkles,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  refreshSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
} from "@/actions/subscription.actions";
import { toast } from "sonner";
import Link from "next/link";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";

interface BillingSettingsSectionProps {
  subscription: {
    status: string;
    currentPeriodEnd: Date;
    mercadopagoSubscriptionId: string;
    discountedUntil?: Date | null;
    discountCode?: { overridePrice: number } | null;
  } | null;
  trialEndsAt: Date | null;
}

const formatFullDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(
    new Date(date)
  );
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "authorized":
      return {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2,
        label: "Activa",
        description: "Tu plan está funcionando correctamente.",
      };
    case "paused":
      return {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: AlertTriangle,
        label: "Cancelación Programada",
        description: "Tenés acceso hasta el final del periodo actual.",
      };
    case "cancelled":
      return {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
        label: "Cancelada",
        description: "Tu suscripción fue cancelada.",
      };
    case "pending":
      return {
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: AlertTriangle,
        label: "Pago Pendiente",
        description: "Estamos procesando tu pago.",
      };
    default:
      return {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: AlertTriangle,
        label: status,
        description: "Estado desconocido.",
      };
  }
};

export function BillingSettingsSection({
  subscription,
  trialEndsAt,
}: BillingSettingsSectionProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isPendingSync, startTransitionSync] = useTransition();
  const [isPendingCancel, startTransitionCancel] = useTransition();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const isInTrial = trialEndsAt && new Date(trialEndsAt) > new Date();
  const hasSubscription = subscription && subscription.status !== "cancelled";
  const standardPrice = 9900;
  const setStatus = useSubscriptionStore((state) => state.setStatus);

  const handleSync = () => {
    startTransitionSync(async () => {
      const result = await refreshSubscriptionStatus();
      if (result.success) {
        const messages: Record<string, string> = {
          authorized: "Tu pago se procesó correctamente. ¡Tu plan está activo!",
          pending: "El pago está pendiente. Podría estar demorado.",
          paused: "Tu suscripción está pausada en Mercado Pago.",
          cancelled: "Tu suscripción fue cancelada.",
        };
        const userMessage =
          messages[result.status as string] ||
          `Estado sincronizado: ${result.status}`;

        if (result.status === "authorized") {
          toast.success("Estado actualizado", { description: userMessage });
          await update();
          setStatus(result.status);
          router.refresh();
        } else {
          toast.info("Estado actualizado", { description: userMessage });
          await update();
          setStatus(result.status as string);
          router.refresh();
        }
      } else {
        toast.error("No se pudo actualizar", { description: result.message });
      }
    });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!subscription) return;
    startTransitionCancel(async () => {
      const result = await cancelSubscription(
        subscription.mercadopagoSubscriptionId
      );
      if (result.success) {
        toast.success("Suscripción cancelada", {
          description: "Ya no se renovará automáticamente.",
        });
        await update();
        router.refresh();
        setIsCancelDialogOpen(false);
      } else {
        toast.error("No se pudo cancelar", { description: result.error });
        setIsCancelDialogOpen(false);
      }
    });
  };

  const handleReactivate = () => {
    if (!subscription) return;
    startTransitionSync(async () => {
      const result = await reactivateSubscription(
        subscription.mercadopagoSubscriptionId
      );
      if (result.success) {
        toast.success("Suscripción reactivada", {
          description: "Tu plan vuelve a estar activo.",
        });
        await update();
        router.refresh();
      } else {
        toast.error("No se pudo reactivar", { description: result.error });
      }
    });
  };

  if (!subscription || subscription.status === "cancelled") {
    return (
      <SettingsCard
        icon={Crown}
        title="Suscripción"
        description="Gestioná tu plan y facturación"
      >
        <div className="space-y-4">
          <div className="flex gap-3 items-start p-4 rounded-lg border bg-muted/30">
            <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">
                {isInTrial ? "Prueba gratuita activa" : "Sin suscripción"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isInTrial
                  ? `Tu prueba termina el ${formatFullDate(trialEndsAt!)}`
                  : "Suscribite al Plan PRO para acceder a todas las funcionalidades."}
              </p>
            </div>
          </div>

          <Button asChild className="w-full">
            <Link href="/dashboard/billing">
              <Crown className="mr-2 w-4 h-4" />
              Ver Plan PRO
            </Link>
          </Button>
        </div>
      </SettingsCard>
    );
  }

  const config = getStatusConfig(subscription.status);
  const StatusIcon = config.icon;
  const isDiscountActive =
    subscription.discountedUntil &&
    new Date(subscription.discountedUntil) > new Date();

  return (
    <SettingsCard
      icon={Crown}
      title="Suscripción"
      description="Gestioná tu plan y facturación"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Estado actual
            </p>
            <p className="mt-1 font-semibold">Plan PRO</p>
          </div>
          <Badge
            variant="outline"
            className={`${config.color} flex items-center gap-2 px-3 py-1.5 text-sm font-medium`}
          >
            <StatusIcon className="w-4 h-4" />
            {config.label}
          </Badge>
        </div>

        <div className="flex gap-3 items-start p-4 rounded-lg border bg-muted/30">
          <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {subscription.status === "paused"
                ? "Acceso hasta"
                : "Próximo cobro"}
            </p>
            <p className="mt-1 font-semibold">
              {formatFullDate(subscription.currentPeriodEnd)}
            </p>
            {!isDiscountActive && subscription.status === "authorized" && (
              <p className="mt-1 text-sm text-muted-foreground">
                ${standardPrice}/mes
              </p>
            )}
          </div>
        </div>

        {isDiscountActive && subscription.discountCode && (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex gap-3 items-start">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  Descuento especial activo
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Estás pagando{" "}
                  <span className="font-bold text-foreground">
                    ${subscription.discountCode.overridePrice}/mes
                  </span>{" "}
                  hasta el{" "}
                  <span className="font-medium text-foreground">
                    {formatFullDate(subscription.discountedUntil!)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 space-y-3 border-t">
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

          {subscription.status === "paused" ? (
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
                "Reactivar Plan PRO"
              )}
            </Button>
          ) : subscription.status === "authorized" ? (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  toast.info("Gestionar medio de pago", {
                    description:
                      "Escribinos por WhatsApp para cambiar tu tarjeta.",
                  })
                }
              >
                <CreditCard className="mr-2 w-4 h-4" />
                Cambiar medio de pago
              </Button>

              <AlertDialog
                open={isCancelDialogOpen}
                onOpenChange={setIsCancelDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-destructive"
                  >
                    Cancelar suscripción
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar tu Plan PRO?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Perderás acceso después del{" "}
                      {formatFullDate(subscription.currentPeriodEnd)}. Podés
                      seguir usando Turnix hasta esa fecha.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mantener suscripción</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={isPendingCancel}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isPendingCancel && (
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      )}
                      Cancelar Plan PRO
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </div>

        <div className="pt-4 border-t">
          <Button variant="link" asChild className="p-0 h-auto text-xs">
            <a
              href="https://www.mercadopago.com.ar/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-1 items-center text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-3 h-3" />
              Gestionar en Mercado Pago
            </a>
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            ID: {subscription.mercadopagoSubscriptionId}
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
