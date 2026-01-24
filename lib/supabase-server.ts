import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseServerInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (supabaseServerInstance) {
    return supabaseServerInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
    );
  }

  supabaseServerInstance = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseServerInstance;
}

type BroadcastEvent =
  | "new-notification"
  | "team-joined"
  | "team-removed"
  | "booking-created"
  | "booking-updated"
  | "booking-paid";

export async function broadcastToUser(
  userId: string,
  event: BroadcastEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Broadcast] Missing Supabase environment variables");
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `user:${userId}`,
            event,
            payload,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[Broadcast] Failed to send:", await response.text());
    }
  } catch (error) {
    console.error("[Broadcast] Error sending message:", error);
  }
}
