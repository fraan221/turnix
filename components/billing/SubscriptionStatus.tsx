"use client";

import { useState, useEffect } from "react";
import { intervalToDuration } from "date-fns";
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
      const duration = intervalToDuration({
        start: new Date(),
        end: new Date(trialEndsAt),
      });

      const days = duration.days || 0;
      const hours = (duration.hours || 0).toString().padStart(2, "0");
      const minutes = (duration.minutes || 0).toString().padStart(2, "0");
      const seconds = (duration.seconds || 0).toString().padStart(2, "0");

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
