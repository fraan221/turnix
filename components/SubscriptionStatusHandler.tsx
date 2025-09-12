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

    const handleSuccess = async () => {
      if (processedRef.current) return;
      processedRef.current = true;

      toast.success("¡Suscripción exitosa!", {
        description: "Tu plan PRO ha sido activado.",
      });

      await update();
      router.refresh();
      router.replace(pathname, { scroll: false });
    };

    if (subscriptionStatus === "success") {
      handleSuccess();
    }
  }, [searchParams, update, router, pathname]);

  return null;
}
