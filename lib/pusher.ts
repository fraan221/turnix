import PusherServer from "pusher";

const host = process.env.PUSHER_HOST_INTERNAL || process.env.NEXT_PUBLIC_PUSHER_HOST!;
const port = process.env.PUSHER_PORT_INTERNAL || process.env.NEXT_PUBLIC_PUSHER_PORT!;
const useTLS = (process.env.PUSHER_TLS_INTERNAL || process.env.NEXT_PUBLIC_PUSHER_TLS) === "true";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  host: host,
  port: port,
  useTLS: useTLS,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
});