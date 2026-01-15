"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { refreshSubscriptionStatus } from "@/actions/subscription.actions";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { Loader2 } from "lucide-react";

export default function SubscriptionStatusHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { update } = useSession();
  const setStatus = useSubscriptionStore((state) => state.setStatus);

  const processedRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const subscriptionStatus = searchParams.get("subscription");

    if (subscriptionStatus !== "success" || processedRef.current) {
      return;
    }

    processedRef.current = true;
    setIsSyncing(true);

    const handleSuccess = async () => {
      try {
        toast.loading("Verificando tu pago con Mercado Pago...", {
          id: "subscription-sync",
        });

        const result = await refreshSubscriptionStatus();

        if (result.success && result.status === "authorized") {
          await update();
          setStatus(result.status);
          
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("subscription");
          window.history.replaceState({}, "", newUrl.pathname + newUrl.search);

          toast.success("¡Pago confirmado!", {
            id: "subscription-sync",
            description: "Tu Plan PRO está activo. ¡Bienvenido!",
          });

          router.refresh();
        } else if (result.success) {
          await update();
          setStatus(result.status as string);
          router.refresh();
          router.replace(pathname, { scroll: false });

          const statusMessages: Record<string, string> = {
            pending: "Tu pago está siendo procesado. Podés verificar de nuevo en unos minutos.",
            paused: "Tu suscripción está pausada.",
            cancelled: "Tu suscripción fue cancelada.",
          };

          toast.info("Estado de pago", {
            id: "subscription-sync",
            description: statusMessages[result.status as string] || `Estado: ${result.status}`,
          });
        } else {
          await update();
          router.replace(pathname, { scroll: false });

          toast.error("No pudimos verificar tu pago", {
            id: "subscription-sync",
            description: result.message || "Intentá de nuevo en unos minutos.",
          });
        }
      } catch (error) {
        console.error("Error syncing subscription:", error);
        await update();
        router.replace(pathname, { scroll: false });

        toast.error("Error al verificar", {
          id: "subscription-sync",
          description: "Ocurrió un error. Si ya pagaste, tu acceso se activará pronto.",
        });
      } finally {
        setIsSyncing(false);
      }
    };

    handleSuccess();
  }, [searchParams, update, router, pathname, setStatus]);

  if (isSyncing) {
    return (
      <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-background/80">
        <div className="flex flex-col gap-4 items-center p-6 rounded-lg border shadow-lg bg-card">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium">Verificando tu pago...</p>
            <p className="text-sm text-muted-foreground">
              Esto solo tomará un momento
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
