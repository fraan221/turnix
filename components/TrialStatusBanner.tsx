import { getUserForLayout } from "@/lib/data";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Esta función ahora se ejecuta en el servidor.
const calculateTimeLeft = (endDate: Date | null | undefined) => {
  if (!endDate) return "";
  const distance = new Date(endDate).getTime() - new Date().getTime();

  if (distance < 0) {
    return "Tu prueba ha finalizado.";
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
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

// El componente ahora es un Server Component asíncrono.
export default async function TrialStatusBanner() {
  // 1. Obtenemos los datos más frescos directamente de la base de datos.
  const user = await getUserForLayout();

  // Si no hay usuario, no hay banner.
  if (!user) {
    return null;
  }

  const { trialEndsAt, role, subscription } = user;
  const isOwner = role === "OWNER";
  const isSubscribed = subscription?.status === "authorized";

  // 2. La lógica para mostrar el banner ahora usa datos 100% actualizados.
  const showTrialBanner =
    isOwner &&
    !isSubscribed &&
    trialEndsAt &&
    new Date(trialEndsAt) > new Date();

  if (!showTrialBanner) {
    return null;
  }

  const timeLeft = calculateTimeLeft(trialEndsAt);

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
