"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export function useBroadcast(
  userId: string | undefined,
  onEvent: (event: string, payload: any) => void,
) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`user:${userId}`)
      .on("broadcast", { event: "*" }, (payload) => {
        onEvent(payload.event, payload.payload);

        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router, onEvent]);
}
