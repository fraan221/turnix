"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { pusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";

export function PusherHandler() {
  const { data: session } = useSession();
  const hasBeenTriggered = useRef(false);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }
    321463;
    if (!session.user.teamMembership) {
      return;
    }

    const channel = pusherClient.subscribe(`user-${session.user.id}`);

    const handleTeamRemoved = () => {
      if (hasBeenTriggered.current) {
        return;
      }
      hasBeenTriggered.current = true;

      toast.info("Has sido eliminado de tu equipo.", {
        description: "Por seguridad, tu sesión se cerrará.",
      });

      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 2000);
    };

    channel.bind("team-removed", handleTeamRemoved);

    return () => {
      channel.unbind("team-removed", handleTeamRemoved);
      pusherClient.unsubscribe(`user-${session.user.id}`);
    };
  }, [session]);

  return null;
}
