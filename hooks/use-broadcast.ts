"use client";

import { useEffect, useRef, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function useBroadcast(
  userId: string | undefined,
  onEvent: (event: string, payload: any) => void,
) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`user:${userId}`)
      .on("broadcast", { event: "*" }, (payload) => {
        onEventRef.current(payload.event, payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
