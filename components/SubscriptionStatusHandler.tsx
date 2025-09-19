"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function SubscriptionStatusHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { update } = useSession();

  const processedRef = useRef(false);

  useEffect(() => {
    const subscriptionStatus = searchParams.get("subscription");

    if (subscriptionStatus !== "success" || processedRef.current) {
      return;
    }

    processedRef.current = true;

    const handleSuccess = async () => {
      const loadingToast = toast.loading("Aplicando tu suscripción...");
      await update();
      router.refresh();

      router.replace(pathname, { scroll: false });
      toast.dismiss(loadingToast);
      toast.success("¡Suscripción exitosa!", {
        description: "Tu plan PRO ha sido activado.",
      });
    };

    handleSuccess();
  }, [searchParams, update, router, pathname]);

  return null;
}
