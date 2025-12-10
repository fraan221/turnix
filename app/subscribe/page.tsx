import Link from "next/link";
import { ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { LogoutForm } from "@/components/LogoutButton";
import { SubscriptionCta } from "@/components/billing/SubscriptionCta";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/data";
import { SubscriptionManagement } from "@/components/billing/SubscriptionManagement";

interface SubscribePageProps {
  searchParams: {
    reason?: string;
  };
}

export default async function SubscribePage({ searchParams }: SubscribePageProps) {
  const user = await getCurrentUser();
  const reason = searchParams.reason;
  const isProactiveSubscription = reason === "trial";

  return (
    <main className="flex relative flex-col justify-center items-center p-4 min-h-screen bg-gray-50 dark:bg-black">
      <Link href="/dashboard" passHref>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 sm:top-6 sm:left-6"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Link>

      <div className="space-y-8 w-full max-w-lg">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            {isProactiveSubscription ? (
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="w-8 h-8 text-primary" />
              </div>
            ) : (
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-heading">
              {isProactiveSubscription
                ? "Tu prueba está por terminar"
                : "Tu prueba gratuita finalizó"}
            </h1>
            <p className="mx-auto max-w-md text-base text-muted-foreground">
              {isProactiveSubscription
                ? "Suscribite ahora para seguir gestionando tu barbería sin interrupciones."
                : "Necesitás el Plan PRO para volver a acceder a tu agenda, clientes y todos tus datos."}
            </p>
          </div>
        </div>

        {user?.subscription && (
          <SubscriptionManagement subscription={user.subscription} />
        )}

        <div>
          <SubscriptionCta isTrial={isProactiveSubscription} />
        </div>

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
