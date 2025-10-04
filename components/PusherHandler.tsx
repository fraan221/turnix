"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";

export function PusherHandler() {
  const { data: session, update } = useSession();
  const hasBeenTriggered = useRef(false);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const channel = pusherClient.subscribe(`user-${session.user.id}`);

    const handleTeamRemoved = async () => {
      if (hasBeenTriggered.current) {
        return;
      }
      hasBeenTriggered.current = true;

      toast.info("Has sido eliminado de tu equipo.", {
        description: "Redirigiendo...",
      });

      await update();
      window.location.href = "/dashboard";
    };

    channel.bind("team-removed", handleTeamRemoved);

    return () => {
      channel.unbind("team-removed", handleTeamRemoved);
      pusherClient.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id]);

  return null;
}
