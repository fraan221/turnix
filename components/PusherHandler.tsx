"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { pusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";
import { CheckCircle2, UserX } from "lucide-react";

export function PusherHandler() {
  const { data: session } = useSession();
  const hasBeenTriggered = useRef(false);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const channel = pusherClient.subscribe(`user-${userId}`);

    const handleTeamRemoved = () => {
      if (hasBeenTriggered.current) return;
      hasBeenTriggered.current = true;

      toast.info("Has sido eliminado de tu equipo.", {
        description: "Por seguridad, tu sesión se cerrará.",
        icon: <UserX className="w-5 h-5" />,
      });

      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 2000);
    };

    const handleBookingPaid = (payload: any) => {
      const { clientName, bookingId } = payload;
      toast.success("¡Nuevo Turno Señado! 💸", {
        description: `${clientName} ha pagado la seña.`,
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      window.dispatchEvent(
        new CustomEvent("booking-realtime-update", {
          detail: { bookingId, status: "PAID" },
        })
      );
    };

    channel.bind("team-removed", handleTeamRemoved);
    channel.bind("booking-paid", handleBookingPaid);

    return () => {
      channel.unbind("team-removed", handleTeamRemoved);
      channel.unbind("booking-paid", handleBookingPaid);
      // Solo nos desuscribimos si el ID realmente cambia, no en re-renders aleatorios
    };
  }, [session?.user?.id]);

  return null;
}
