"use client";

import { useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RealtimeTable = "Notification" | "Booking" | "Team";

type FilterColumn = {
  Notification: "userId";
  Booking: "barberId";
  Team: "userId";
};

interface UseRealtimeSubscriptionOptions<T extends Record<string, unknown>> {
  userId: string;
  table: RealtimeTable;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: T) => void;
  enabled?: boolean;
}

const FILTER_COLUMNS: FilterColumn = {
  Notification: "userId",
  Booking: "barberId",
  Team: "userId",
};

export function useRealtimeSubscription<T extends Record<string, unknown>>({
  userId,
  table,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeSubscriptionOptions<T>) {
  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      switch (payload.eventType) {
        case "INSERT":
          onInsert?.(payload.new);
          break;
        case "UPDATE":
          onUpdate?.(payload.new);
          break;
        case "DELETE":
          onDelete?.(payload.old as T);
          break;
      }
    },
    [onInsert, onUpdate, onDelete],
  );

  useEffect(() => {
    if (!userId || !enabled) return;

    const supabase = getSupabaseBrowserClient();
    const filterColumn = FILTER_COLUMNS[table];

    const channel = supabase
      .channel(`${table.toLowerCase()}-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: `${filterColumn}=eq.${userId}`,
        },
        handleChange,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, table, handleChange, enabled]);
}
