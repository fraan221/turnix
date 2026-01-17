"use client";

import {
  useSubscriptionStore,
  selectStatus,
  selectTrialEndsAt,
  selectIsPro,
  selectIsTrialActive,
  selectIsHydrated,
} from "@/lib/stores/subscription-store";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";

const calculateTimeLeft = (endDate: Date | null) => {
  if (!endDate) return "";
  const distance = new Date(endDate).getTime() - Date.now();

  if (distance < 0) {
    return "Tu prueba ha finalizado.";
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  if (days > 0) {
    return `${days} día${days > 1 ? "s" : ""} y ${hours} hora${
      hours > 1 ? "s" : ""
    }`;
  }
  if (hours > 0) {
    return `${hours} hora${hours > 1 ? "s" : ""}`;
  }
  return "Menos de una hora";
};

export default function TrialStatusBanner() {
  const { data: session } = useSession();

  const storeStatus = useSubscriptionStore(selectStatus);
  const storeTrialEndsAt = useSubscriptionStore(selectTrialEndsAt);
  const isHydrated = useSubscriptionStore(selectIsHydrated);

  const status = isHydrated
    ? storeStatus
    : session?.user?.subscription?.status || null;

  const trialEndsAt = isHydrated
    ? storeTrialEndsAt
    : session?.user?.trialEndsAt
      ? new Date(session.user.trialEndsAt)
      : null;

  const isOwner = session?.user?.role === "OWNER";
  if (!isOwner) {
    return null;
  }

  const isPro = status === "authorized";
  const isPaused = status === "paused";
  if (isPro || isPaused) {
    return null;
  }

  const isTrialActive =
    trialEndsAt && new Date(trialEndsAt).getTime() > Date.now();
  if (!isTrialActive) {
    return null;
  }

  const timeLeft = calculateTimeLeft(trialEndsAt);

  return (
    <div className="flex flex-col gap-2 justify-center items-center p-3 w-full text-sm text-center text-white bg-primary sm:flex-row sm:justify-between">
      <div className="flex gap-2 items-center font-semibold text-md">
        <p>Te quedan {timeLeft} de prueba gratuita</p>
      </div>
      <Button
        asChild
        variant="secondary"
        size="sm"
        className="bg-white text-primary hover:bg-white/90"
      >
        <Link href="/subscribe?reason=trial">
          Continuar con Turnix <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
