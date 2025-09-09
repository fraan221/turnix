"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const calculateTimeLeft = (endDate: Date | string | null | undefined) => {
  if (!endDate) return "";
  const distance = new Date(endDate).getTime() - new Date().getTime();

  if (distance < 0) {
    return "Tu prueba ha finalizado.";
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

  return `${days} días ${hours}:${minutes}:${seconds}`;
};

export default function SubscriptionStatus() {
  const { data: session } = useSession();
  const trialEndsAt = session?.user?.trialEndsAt;

  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(trialEndsAt)
  );

  const isInTrial = trialEndsAt && new Date(trialEndsAt) > new Date();

  useEffect(() => {
    if (!trialEndsAt || !isInTrial) return;

    setTimeLeft(calculateTimeLeft(trialEndsAt));

    const intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft(trialEndsAt));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [trialEndsAt, isInTrial]);

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
