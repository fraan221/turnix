"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

type BroadcastEvent =
  | "new-notification"
  | "team-joined"
  | "team-removed"
  | "booking-created"
  | "booking-updated";

interface UseBroadcastOptions<T> {
  userId: string;
  event: BroadcastEvent;
  onMessage: (payload: T) => void;
  enabled?: boolean;
}

export function useBroadcast<T>({
  userId,
  event,
  onMessage,
  enabled = true,
}: UseBroadcastOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId || !enabled) return;

    const supabase = getSupabaseBrowserClient();
    const channelName = `user:${userId}`;

    const channel = supabase.channel(channelName);

    (
      channel as unknown as {
        on: (
          type: string,
          filter: { event: string },
          callback: (payload: { payload: T }) => void,
        ) => RealtimeChannel;
      }
    ).on("broadcast", { event }, (payload: { payload: T }) => {
      onMessageRef.current(payload.payload);
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`[Supabase] Subscribed to broadcast: ${channelName}`);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, event, enabled]);
}
