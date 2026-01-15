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
  const shouldShowSubscribeCta =
    isInTrial || isCancelled || !user.subscription;

  // Active subscription - Show benefits/retention view
  if (hasActiveSubscription || isPaused) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Success Banner */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                {isPaused ? (
                  <Crown className="h-6 w-6 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">
                    {isPaused ? "Plan PRO - Acceso Activo" : "¡Sos PRO!"}
                  </CardTitle>
                  <Badge
                    variant={isPaused ? "secondary" : "default"}
                    className={
                      isPaused
                        ? "bg-yellow-100 text-yellow-700"
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

        {/* Benefits List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Tus beneficios activos</h2>
          </div>
          <SubscriptionFeatures price={9900} />
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/dashboard">
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir al Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/dashboard/settings?section=billing">
              <Settings className="mr-2 h-4 w-4" />
              Gestionar suscripción
            </Link>
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-muted-foreground">
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
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Crown className="h-8 w-8 text-primary" />
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
