"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface TrialStatusBannerProps {
  trialEndsAt: Date | null | undefined;
  isSubscribed: boolean;
}

export default function TrialStatusBanner({
  trialEndsAt,
  isSubscribed,
}: TrialStatusBannerProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!trialEndsAt) return;

    const intervalId = setInterval(() => {
      const distance = new Date(trialEndsAt).getTime() - new Date().getTime();

      if (distance < 0) {
        setTimeLeft("Tu prueba ha finalizado.");
        clearInterval(intervalId);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days} días ${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [trialEndsAt]);

  if (!timeLeft || !trialEndsAt) return null;
  if (isSubscribed) return null;

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
