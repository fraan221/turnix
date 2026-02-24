import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST!,
    wsPort: parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT ?? "443"),
    wssPort: parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT ?? "443"),
    forceTLS: process.env.NEXT_PUBLIC_PUSHER_TLS === "true",
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
  }
);
