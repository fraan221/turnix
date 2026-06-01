import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock, AlertCircle, AlertTriangle, CreditCard, Ban, CheckCircle } from "lucide-react";
import { LogoutForm } from "@/components/LogoutButton";
import { SubscriptionCta } from "@/components/billing/SubscriptionCta";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/data";
import { SubscriptionManagement } from "@/components/billing/SubscriptionManagement";

interface SubscribePageProps {
  searchParams: Promise<{
    reason?: string;
  }>;
}

type SubscribeReason =
  | "trial_expiring"
  | "trial_expired"
  | "payment_failed"
  | "cancelled"
  | "no_subscription"
  | "authorized";

const REASON_CONFIGS = {
  trial_expiring: {
    Icon: Clock,
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
    title: "Tu prueba está por terminar",
    description: "Suscribite ahora para seguir gestionando tu barbería sin interrupciones.",
    isTrial: true,
    showCta: true,
  },
  trial_expired: {
    Icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-500",
    bgClass: "bg-amber-100 dark:bg-amber-950/30",
    title: "Tu prueba gratuita finalizó",
    description: "Necesitás el Plan PRO para volver a acceder a tu agenda, clientes y todos tus datos.",
    isTrial: true,
    showCta: true,
  },
  payment_failed: {
    Icon: CreditCard,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10",
    title: "Problema con tu pago",
    description: "No pudimos procesar tu pago. Verificá o actualizá tu método de pago en Mercado Pago para recuperar el acceso.",
    isTrial: false,
    showCta: true,
  },
  cancelled: {
    Icon: Ban,
    iconClass: "text-muted-foreground",
    bgClass: "bg-muted/50 dark:bg-muted/20",
    title: "Tu suscripción fue cancelada",
    description: "Tu plan ya no está activo. Podés reactivar la suscripción para recuperar el acceso.",
    isTrial: false,
    showCta: true,
  },
  no_subscription: {
    Icon: AlertCircle,
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
    title: "Necesitás el Plan PRO",
    description: "Suscribite para poder acceder a tu agenda, clientes y comenzar a gestionar tu barbería.",
    isTrial: true,
    showCta: true,
  },
  authorized: {
    Icon: CheckCircle,
    iconClass: "text-green-600 dark:text-green-500",
    bgClass: "bg-green-100 dark:bg-green-950/30",
    title: "Tu suscripción está activa",
    description: "¡Gracias por confiar en Turnix! Tenés acceso ilimitado a todas las funciones PRO.",
    isTrial: false,
    showCta: false,
  },
};

interface UserForResolve {
  trialEndsAt: Date | null;
  subscription: {
    status: string;
    pendingSince: Date | null;
    mercadopagoSubscriptionId: string;
  } | null;
}

function resolveSubscribeReason(
  user: UserForResolve,
  queryReason?: string
): SubscribeReason {
  const now = Date.now();
  const hasTrial = !!user?.trialEndsAt;
  const isTrialActive = hasTrial && new Date(user.trialEndsAt!).getTime() > now;

  // 1. Si el usuario ya tiene suscripción activa (authorized)
  if (user?.subscription?.status === "authorized") {
    return "authorized";
  }

  // 2. Acceso proactivo por query param
  if (queryReason === "trial") {
    return isTrialActive ? "trial_expiring" : "trial_expired";
  }

  // 3. Pago pendiente fuera del período de gracia (3 días)
  if (user?.subscription?.status === "pending" && user.subscription.pendingSince) {
    const pendingSince = new Date(user.subscription.pendingSince);
    const pendingGraceEnd = new Date(pendingSince);
    pendingGraceEnd.setDate(pendingGraceEnd.getDate() + 3);
    if (pendingGraceEnd.getTime() <= now) {
      return "payment_failed";
    }
  }

  // 4. Suscripción pausada o cancelada
  if (user?.subscription?.status === "paused" || user?.subscription?.status === "cancelled") {
    return "cancelled";
  }

  // 5. Casos por defecto basados en si tuvo período de prueba
  if (hasTrial) {
    return "trial_expired";
  }

  return "no_subscription";
}

export default async function SubscribePage(props: SubscribePageProps) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const resolvedReason = resolveSubscribeReason(user, searchParams.reason);
  const config = REASON_CONFIGS[resolvedReason];

  return (
    <main className="flex relative flex-col justify-center items-center p-4 min-h-screen bg-gray-50 dark:bg-black">
      <Link href="/dashboard" passHref>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 sm:top-6 sm:left-6"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft className="size-5" />
        </Button>
      </Link>

      <div className="flex flex-col gap-8 w-full max-w-lg">
        <div className="flex flex-col gap-4 text-center">
          <div className="flex justify-center">
            <div className={`p-3 rounded-full ${config.bgClass}`}>
              <config.Icon className={`size-8 ${config.iconClass}`} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight font-heading">
              {config.title}
            </h1>
            <p className="mx-auto max-w-md text-base text-muted-foreground">
              {config.description}
            </p>
          </div>
        </div>

        {user.subscription?.mercadopagoSubscriptionId && (
          <SubscriptionManagement subscription={user.subscription} />
        )}

        {config.showCta && (
          <div>
            <SubscriptionCta isTrial={config.isTrial} />
          </div>
        )}

        <div className="relative">
          <div className="flex absolute inset-0 items-center">
            <span className="w-full border-t" />
          </div>
          <div className="flex relative justify-center text-xs uppercase">
            <span className="px-2 bg-gray-50 dark:bg-black text-muted-foreground">
              o
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <LogoutForm />
        </div>
      </div>
    </main>
  );
}
