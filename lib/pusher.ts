import PusherServer from "pusher";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  host: process.env.NEXT_PUBLIC_PUSHER_HOST!,
  port: process.env.NEXT_PUBLIC_PUSHER_PORT!,
  useTLS: process.env.NEXT_PUBLIC_PUSHER_TLS === "true",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
});
