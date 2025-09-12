"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const calculateTimeLeft = (endDate: Date | string | null | undefined) => {
  if (!endDate) return "";
  const distance = new Date(endDate).getTime() - new Date().getTime();

  if (distance < 0) {
    return "Tu prueba ha finalizado.";
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return `${days} días ${hours}:${minutes}:${seconds}`;
};

export default function TrialStatusBanner() {
  const { data: session } = useSession();
  const user = session?.user;
  const trialEndsAt = user?.trialEndsAt;

  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(trialEndsAt)
  );

  const isOwner = user?.role === "OWNER";
  const isSubscribed = user?.subscription?.status === "authorized";
  const showTrialBanner =
    isOwner &&
    !isSubscribed &&
    trialEndsAt &&
    new Date(trialEndsAt) > new Date();

  useEffect(() => {
    if (!trialEndsAt || !showTrialBanner) return;

    setTimeLeft(calculateTimeLeft(trialEndsAt));

    const intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft(trialEndsAt));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [trialEndsAt, showTrialBanner]);

  if (!showTrialBanner) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full gap-2 p-3 text-sm text-center text-white bg-primary sm:flex-row sm:justify-between">
      <div className="flex items-center gap-2 font-semibold text-md">
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
