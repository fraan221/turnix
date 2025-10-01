import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoutForm } from "@/components/LogoutButton";
import { SubscriptionCta } from "@/components/billing/SubscriptionCta";

interface SubscribePageProps {
  searchParams: {
    reason?: string;
  };
}

export default function SubscribePage({ searchParams }: SubscribePageProps) {
  const reason = searchParams.reason;
  const isProactiveSubscription = reason === "trial";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-heading">
            {isProactiveSubscription
              ? "¡Continuá sin interrupciones!"
              : "Tu prueba gratuita terminó"}
          </CardTitle>
          <CardDescription className="max-w-xs mx-auto text-muted-foreground">
            {isProactiveSubscription
              ? "Suscríbete ahora y seguí gestionando tu barbería sin perder ni un turno."
              : "Suscríbete al Plan PRO para recuperar el acceso a todos tus datos y turnos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionCta isTrial={isProactiveSubscription} />
        </CardContent>
        <CardFooter className="flex flex-col items-center w-full">
          <LogoutForm />
        </CardFooter>
      </Card>
    </main>
  );
}
