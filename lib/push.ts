import webpush, { type WebPushError } from "web-push";
import prisma from "@/lib/prisma";

webpush.setVapidDetails(
  "mailto:turnix.app.234@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    console.log(`No hay suscripciones activas para el usuario ${userId}`);
    return;
  }

  const notificationPromises = subscriptions.map((sub) => {
    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    const payloadString = JSON.stringify(payload);

    return webpush
      .sendNotification(subscription, payloadString)
      .catch((error: WebPushError) => {
        if (error.statusCode === 410) {
          console.log(`Suscripción expirada, eliminando: ${sub.endpoint}`);
          return prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error("Error al enviar notificación:", error);
        }
      });
  });

  await Promise.all(notificationPromises);
}
