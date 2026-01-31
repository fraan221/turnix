"use client";

import { useSession, signOut } from "next-auth/react";
import { useBroadcast } from "@/hooks/use-broadcast";
import { toast } from "sonner";
import { CheckCircle2, Calendar, UserX } from "lucide-react";
import { useRef } from "react";

export function RealtimeToastHandler() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const isRedirecting = useRef(false);

  useBroadcast(userId, (event, payload) => {
    console.log("[Broadcast Received]", event, payload);

    if (event === "team-removed") {
      if (isRedirecting.current) return;
      isRedirecting.current = true;

      toast.message("Has sido eliminado del equipo", {
        description:
          "El dueño de la barbería te ha removido. Serás redirigido al inicio de sesión.",
        icon: <UserX className="w-5 h-5" />,
        duration: 5000,
      });

      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 2000);

      return;
    }

    if (event === "booking-paid") {
      const { clientName, bookingId } = payload;

      const title = "¡Nuevo Turno Señado! 💸";
      const description =
        payload.message || `${clientName} ha pagado la seña de su turno.`;

      toast.message(title, {
        description: description,
        icon: <CheckCircle2 className="w-5 h-5" />,
        duration: 8000,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("booking-realtime-update", {
            detail: { bookingId, status: "PAID" },
          }),
        );
      }
    }

    if (event === "new-notification") {
      const { message } = payload;
      toast.message("Nuevo Turno Agendado", {
        description: message,
        icon: <Calendar className="w-4 h-4" />,
      });
    }
  });

  return null;
}
