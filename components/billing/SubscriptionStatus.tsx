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
import { Clock, AlertCircle } from "lucide-react";

const calculateTimeLeft = (endDate: Date | string | null | undefined) => {
  if (!endDate) return "";
  const distance = new Date(endDate).getTime() - new Date().getTime();

  if (distance < 0) {
    return "expirada";
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

  if (days === 0) {
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${days}d ${hours}:${minutes}:${seconds}`;
};

export default function SubscriptionStatus() {
  const { data: session } = useSession();
  const trialEndsAt = session?.user?.trialEndsAt;

  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(trialEndsAt)
  );

  const isInTrial = trialEndsAt && new Date(trialEndsAt) > new Date();
  const isExpired = timeLeft === "expirada";

  useEffect(() => {
    if (!trialEndsAt || !isInTrial) return;

    setTimeLeft(calculateTimeLeft(trialEndsAt));

    const intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft(trialEndsAt));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [trialEndsAt, isInTrial]);

  return (
    <Card className="w-full border-2">
      <CardHeader className="pb-4 space-y-3 text-center">
        {isInTrial ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Prueba gratuita activa</CardTitle>
            </div>
            <CardDescription className="text-base">
              Tu acceso completo termina en:
            </CardDescription>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-xl">
                Prueba gratuita finalizada
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              Suscribite al Plan PRO para seguir gestionando tu barbería.
            </CardDescription>
          </>
        )}
      </CardHeader>
      {isInTrial && !isExpired && (
        <CardContent className="flex flex-col items-center justify-center pb-6">
          <div className="flex items-center gap-3 px-6 py-4 border-2 rounded-lg bg-primary/5 border-primary/20">
            <span className="font-mono text-3xl font-bold tracking-wider text-primary">
              {timeLeft}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Días : Horas : Minutos : Segundos
          </p>
        </CardContent>
      )}
    </Card>
  );
}
