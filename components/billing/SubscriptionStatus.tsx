"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface SubscriptionStatusProps {
  trialEndsAt: Date | null;
}

export default function SubscriptionStatus({
  trialEndsAt,
}: SubscriptionStatusProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const isInTrial = trialEndsAt && trialEndsAt > new Date();

  useEffect(() => {
    if (!trialEndsAt || new Date() > new Date(trialEndsAt)) return;

    const intervalId = setInterval(() => {
      const distance = new Date(trialEndsAt).getTime() - new Date().getTime();

      if (distance < 0) {
        clearInterval(intervalId);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      )
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, "0");

      setTimeLeft(`${days} días ${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [trialEndsAt]);

  return (
    <Card>
      <CardHeader className="text-center">
        {isInTrial ? (
          <>
            <CardTitle>¡No pierdas tu barbería digital!</CardTitle>
            <CardDescription>Tu prueba gratuita se vence en:</CardDescription>
          </>
        ) : (
          <>
            <CardTitle>Tu cuenta está pausada</CardTitle>
            <CardDescription>
              Reactivá tu Plan PRO y volvé a gestionar tu barbería como siempre.
            </CardDescription>
          </>
        )}
      </CardHeader>
      {isInTrial && (
        <CardContent className="flex items-center justify-center">
          <span className="px-3 py-2 font-mono text-xl font-bold rounded-lg bg-primary/10 text-primary">
            {timeLeft}
          </span>
        </CardContent>
      )}
    </Card>
  );
}
