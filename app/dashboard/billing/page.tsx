import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserForLayout } from "@/lib/data";
import BillingSkeleton from "@/components/skeletons/BillingSkeleton";
import { SubscriptionCta } from "@/components/billing/SubscriptionCta";
import { SubscriptionFeatures } from "@/components/SubscriptionFeatures";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Crown,
  ArrowRight,
  Settings,
  Sparkles,
} from "lucide-react";

async function BillingPageContent() {
  const user = await getUserForLayout();

  if (!user) {
    redirect("/login");
  }

  const hasActiveSubscription = user.subscription?.status === "authorized";
  const isPaused = user.subscription?.status === "paused";
  const isInTrial =
    !hasActiveSubscription && user.trialEndsAt && user.trialEndsAt > new Date();
  const isCancelled = user.subscription?.status === "cancelled";
  const shouldShowSubscribeCta = isInTrial || isCancelled || !user.subscription;

  if (hasActiveSubscription || isPaused) {
    return (
      <div className="mx-auto space-y-8 max-w-2xl">
        <Card
          className={
            isPaused
              ? "bg-gradient-to-br border-primary/20 from-primary/5 to-primary/10"
              : "bg-gradient-to-br from-green-50 border-green-200 to-emerald-50/50"
          }
        >
          <CardHeader className="pb-4">
            <div className="flex gap-3 items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isPaused ? "bg-primary/10" : "bg-green-100"
                }`}
              >
                {isPaused ? (
                  <Crown className="w-6 h-6 text-primary" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <div className="flex gap-2 items-center">
                  <CardTitle className="text-xl">
                    {isPaused ? "Plan PRO - Acceso Activo" : "¡Sos PRO!"}
                  </CardTitle>
                  <Badge
                    variant={isPaused ? "secondary" : "default"}
                    className={
                      isPaused
                        ? "text-yellow-700 bg-yellow-100"
                        : "bg-green-600"
                    }
                  >
                    {isPaused ? "Cancelación programada" : "Activo"}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  {isPaused
                    ? "Tu plan sigue activo hasta el final del período actual."
                    : "Tenés acceso completo a todas las funcionalidades premium."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Tus beneficios activos</h2>
          </div>
          <SubscriptionFeatures price={9900} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/dashboard">
              <ArrowRight className="mr-2 w-4 h-4" />
              Ir al Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard/settings?section=billing">
              <Settings className="mr-2 w-4 h-4" />
              Gestionar suscripción
            </Link>
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground">
          Podés gestionar tu suscripción, cambiar método de pago o cancelar
          desde{" "}
          <Link
            href="/dashboard/settings?section=billing"
            className="underline hover:text-foreground"
          >
            Ajustes
          </Link>
          .
        </p>
      </div>
    );
  }

  // No subscription - Show marketing/CTA view
  return (
    <div className="mx-auto space-y-8 max-w-2xl">
      <div className="text-center">
        <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-heading">Plan PRO</h1>
        <p className="mt-2 text-muted-foreground">
          {isInTrial
            ? "Tu prueba gratuita está activa. Suscribite para no perder acceso."
            : "Accedé a todas las funcionalidades premium de Turnix."}
        </p>
      </div>

      {shouldShowSubscribeCta && (
        <SubscriptionCta isTrial={!!isInTrial} showStatus={false} />
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <BillingPageContent />
    </Suspense>
  );
}
