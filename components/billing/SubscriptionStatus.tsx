"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  CreditCard,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  refreshSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
} from "@/actions/subscription.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const calculateTimeLeft = (endDate: Date | string | null | undefined) => {
  if (!endDate) return "";
  const distance = new Date(endDate).getTime() - new Date().getTime();
  if (distance < 0) return "expirada";

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  )
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor((distance % (1000 * 60)) / 1000)
    .toString()
    .padStart(2, "0");

  return days === 0
    ? `${hours}:${minutes}:${seconds}`
    : `${days}d ${hours}:${minutes}:${seconds}`;
};

const formatFullDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(
    new Date(date)
  );
};

interface SubscriptionStatusProps {
  subscription?: {
    status: string;
    currentPeriodEnd: Date;
    mercadopagoSubscriptionId: string;
    discountedUntil?: Date | null;
    discountCode?: {
      overridePrice: number;
    } | null;
  } | null;
}

export default function SubscriptionStatus({
  subscription,
}: SubscriptionStatusProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isPendingSync, startTransitionSync] = useTransition();
  const [isPendingCancel, startTransitionCancel] = useTransition();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const trialEndsAt = session?.user?.trialEndsAt;
  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(trialEndsAt)
  );
  const isInTrial = trialEndsAt && new Date(trialEndsAt) > new Date();
  const isTrialExpired = timeLeft === "expirada";

  useEffect(() => {
    if (!trialEndsAt || !isInTrial) return;
    setTimeLeft(calculateTimeLeft(trialEndsAt));
    const intervalId = setInterval(
      () => setTimeLeft(calculateTimeLeft(trialEndsAt)),
      1000
    );
    return () => clearInterval(intervalId);
  }, [trialEndsAt, isInTrial]);

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
          description:
            "Estamos procesando tu pago. Si demora, revisá tu tarjeta.",
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

  const shouldShowSubscription =
    subscription &&
    (["authorized", "paused"].includes(subscription.status) ||
      !isInTrial);

  if (shouldShowSubscription) {
    const config = getStatusConfig(subscription.status);
    const StatusIcon = config.icon;
    const isDiscountActive =
      subscription.discountedUntil &&
      new Date(subscription.discountedUntil) > new Date();
    const standardPrice = 9900;

  const handleReactivate = () => {
    if (!subscription) return;

    if (subscription.status === "paused") {
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
    } else {
      router.push("/subscribe?reason=manage");
    }
  };

  return (
    <Card className="mx-auto max-w-md rounded-lg border">
      <CardHeader className="pb-4 space-y-1 border-b">
        <div className="flex gap-4 justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl">Plan PRO</CardTitle>
            <CardDescription className="text-sm">
              {config.description}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`${config.color} px-3 py-1.5 flex gap-2 items-center text-sm font-medium shrink-0`}
          >
            <StatusIcon className="w-4 h-4" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="flex gap-3 items-start p-4 rounded-lg border bg-muted/30">
          <Calendar className="w-5 h-5 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Próximo cobro
            </p>
            <p className="mt-1 text-base font-semibold">
              {formatFullDate(subscription.currentPeriodEnd)}
            </p>
            {!isDiscountActive && (
              <p className="mt-1 text-sm text-muted-foreground">
                ${standardPrice}/mes
              </p>
            )}
          </div>
        </div>

        {isDiscountActive && subscription.discountCode && (
          <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
            <div className="flex gap-3 items-start">
              <Sparkles className="w-5 h-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  Descuento especial activo
                </p>
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
                  Después: ${standardPrice}/mes
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
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
            {isPendingSync ? "Verificando..." : "Verificar estado"}
          </Button>
          <p className="mt-2 text-xs text-center text-muted-foreground">
            ID: {subscription.mercadopagoSubscriptionId}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3 pt-4 border-t">
        {subscription.status === "cancelled" ||
        subscription.status === "paused" ? (
          <Button
            className="w-full"
            onClick={handleReactivate}
            disabled={isPendingSync}
          >
            {isPendingSync && subscription.status === "paused" ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Reactivando...
              </>
            ) : (
              "Reactivar Plan PRO"
            )}
          </Button>
        ) : (
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
                      seguir usando Turnix hasta esa fecha, pero después ya no
                      tendrás acceso a tu agenda ni a tus clientes.
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
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md rounded-lg border">
      <CardHeader className="space-y-4 text-center">
        {isInTrial ? (
          <>
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Prueba gratuita activa</CardTitle>
              <CardDescription className="text-base">
                Acceso completo a todas las funcionalidades PRO.
                <br />
                Tu prueba termina en:
              </CardDescription>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">
                Tu prueba gratuita finalizó
              </CardTitle>
              <CardDescription className="text-base">
                Suscribite al Plan PRO para seguir gestionando tu barbería sin
                interrupciones.
              </CardDescription>
            </div>
          </>
        )}
      </CardHeader>

      {isInTrial && !isTrialExpired && (
        <CardContent className="flex flex-col items-center pb-6 space-y-4">
          <div className="inline-flex gap-3 items-center px-8 py-5 rounded-lg border-2 bg-primary/5 border-primary/20">
            <span className="font-mono text-4xl font-bold tracking-wider text-primary">
              {timeLeft}
            </span>
          </div>
          <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            Días : Horas : Minutos : Segundos
          </p>
        </CardContent>
      )}

      {(!isInTrial || isTrialExpired) && (
        <CardContent className="pb-6">
          <Button
            onClick={() => router.push("/subscribe")}
            className="w-full"
            size="lg"
          >
            Suscribirme al Plan PRO
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
