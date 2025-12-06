"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { refreshSubscriptionStatus } from "@/actions/subscription.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const calculateTimeLeft = (endDate: Date | string | null | undefined) => {
  if (!endDate) return "";
  const distance = new Date(endDate).getTime() - new Date().getTime();

  if (distance < 0) {
    return "expirada";
  }

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

  if (days === 0) {
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${days}d ${hours}:${minutes}:${seconds}`;
};

interface SubscriptionStatusProps {
  subscription?: {
    status: string;
    currentPeriodEnd: Date;
    mercadopagoSubscriptionId: string;
  } | null;
}

export default function SubscriptionStatus({
  subscription,
}: SubscriptionStatusProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const trialEndsAt = session?.user?.trialEndsAt;
  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(trialEndsAt)
  );
  const isInTrial = trialEndsAt && new Date(trialEndsAt) > new Date();
  const isTrialExpired = timeLeft === "expirada";

  useEffect(() => {
    if (subscription || !trialEndsAt || !isInTrial) return;

    setTimeLeft(calculateTimeLeft(trialEndsAt));
    const intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft(trialEndsAt));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [trialEndsAt, isInTrial, subscription]);

  const handleSync = () => {
    startTransition(async () => {
      const result = await refreshSubscriptionStatus();

      if (result.success) {
        toast.success(`Estado actualizado: ${result.status}`);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "authorized":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle2,
          label: "Activa",
          description: "Tu suscripción se encuentra al día.",
        };
      case "paused":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: AlertTriangle,
          label: "Pausada",
          description: "La suscripción está pausada temporalmente.",
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
          label: "Cancelada",
          description: "Tu suscripción fue cancelada.",
        };
      case "pending":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: AlertTriangle,
          label: "Pago Pendiente",
          description: "Estamos esperando la confirmación del pago.",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: AlertTriangle,
          label: status,
          description: "Estado desconocido.",
        };
    }
  };

  if (subscription) {
    const config = getStatusConfig(subscription.status);
    const StatusIcon = config.icon;

    return (
      <Card className="w-full border-2 border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                Estado de Suscripción
              </CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`${config.color} px-3 py-1 flex gap-2 items-center text-sm font-medium`}
            >
              <StatusIcon className="w-4 h-4" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 p-3 text-sm rounded-lg sm:grid-cols-2 bg-muted/30">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Vencimiento del ciclo
              </p>
              <p className="text-base font-medium">
                {subscription.currentPeriodEnd
                  ? new Intl.DateTimeFormat("es-AR", {
                      dateStyle: "long",
                    }).format(new Date(subscription.currentPeriodEnd))
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Referencia de Pago
              </p>
              <p
                className="mt-1 font-mono text-xs truncate text-muted-foreground"
                title={subscription.mercadopagoSubscriptionId}
              >
                {subscription.mercadopagoSubscriptionId.slice(0, 15)}...
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              />
              {isPending ? "Verificando..." : "Verificar Estado Ahora"}
            </Button>

            {(subscription.status === "cancelled" ||
              subscription.status === "paused") && (
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push("/subscribe")}
                className="w-full bg-green-600 sm:w-auto hover:bg-green-700"
              >
                Reactivar Plan PRO
              </Button>
            )}
          </div>

          {subscription.status === "pending" && (
            <p className="p-2 text-xs text-orange-600 border border-orange-100 rounded bg-orange-50">
              ⚠️ Si ya realizaste el pago, espera unos instantes y presiona
              "Verificar Estado Ahora".
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`w-full max-w-md mx-auto border-2 ${isInTrial ? "border-primary/20" : "border-red-200"}`}
    >
      <CardHeader className="pb-4 space-y-3 text-center">
        {isInTrial ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Prueba gratuita activa</CardTitle>
            </div>
            <CardDescription className="text-base">
              Disfruta de todas las funcionalidades PRO. Tu acceso termina en:
            </CardDescription>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-xl text-red-700">
                Prueba gratuita finalizada
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              Tu periodo de prueba ha terminado. Suscríbete para continuar
              gestionando tu barbería.
            </CardDescription>
          </>
        )}
      </CardHeader>

      {isInTrial && !isTrialExpired && (
        <CardContent className="flex flex-col items-center justify-center pb-6">
          <div className="flex items-center gap-3 px-6 py-4 border-2 rounded-lg shadow-sm bg-primary/5 border-primary/20">
            <span className="font-mono text-3xl font-bold tracking-wider text-primary">
              {timeLeft}
            </span>
          </div>
          <p className="mt-3 text-xs font-medium tracking-wide uppercase text-muted-foreground">
            Días : Horas : Minutos : Segundos
          </p>
        </CardContent>
      )}

      {(!isInTrial || isTrialExpired) && (
        <CardContent className="flex justify-center pb-6">
          <Button
            onClick={() => router.push("/subscribe")}
            className="w-full sm:w-auto"
            size="lg"
          >
            Suscribirse al Plan PRO
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
