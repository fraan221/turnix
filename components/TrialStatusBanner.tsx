"use client";

import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface TrialStatusBannerProps {
  trialEndsAt: Date | null | undefined;
}

export default function TrialStatusBanner({
  trialEndsAt,
}: TrialStatusBannerProps) {
  if (!trialEndsAt) return null;

  const now = new Date();
  if (trialEndsAt <= now) return null;

  const daysRemaining = differenceInDays(trialEndsAt, now);

  const getMessage = () => {
    if (daysRemaining > 1) {
      return `Te quedan ${daysRemaining} días de prueba.`;
    }
    if (daysRemaining === 1) {
      return "¡Mañana termina tu período de prueba!";
    }
    return "¡Hoy es el último día de tu prueba!";
  };

  return (
    <div className="flex flex-col items-center justify-center w-full gap-2 p-3 text-sm text-center text-white bg-primary sm:flex-row sm:justify-between">
      <p>
        <strong>{getMessage()}</strong>
      </p>
      <Button
        asChild
        variant="secondary"
        size="sm"
        className="bg-white text-primary hover:bg-white/90"
      >
        <Link href="/subscribe?reason=trial">
          Suscribirse <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
