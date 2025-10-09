"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { saveSubscriptionToDb } from "@/actions/push.actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (
      status === "authenticated" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      const setupPushNotifications = async () => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        try {
          const swRegistration =
            await navigator.serviceWorker.register("/sw.js");

          let subscription = await swRegistration.pushManager.getSubscription();

          if (subscription) {
            setIsSubscribed(true);
            return;
          }

          const permission = await window.Notification.requestPermission();
          if (permission !== "granted") {
            console.log("Permiso para notificaciones denegado.");
            return;
          }

          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) {
            console.error("VAPID public key no encontrada.");
            return;
          }

          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });

          if (subscription) {
            const subscriptionJSON = subscription.toJSON();

            if (
              !subscriptionJSON.endpoint ||
              !subscriptionJSON.keys?.p256dh ||
              !subscriptionJSON.keys?.auth
            ) {
              console.error("Suscripción generada inválida", subscriptionJSON);
              toast.error("No se pudieron activar las notificaciones.");
              return;
            }

            const subscriptionToSend = {
              endpoint: subscriptionJSON.endpoint,
              keys: {
                p256dh: subscriptionJSON.keys.p256dh,
                auth: subscriptionJSON.keys.auth,
              },
            };

            await saveSubscriptionToDb(subscriptionToSend);

            setIsSubscribed(true);
            toast.success("Notificaciones activadas", {
              description: "Recibirás avisos de tus nuevos turnos.",
            });
          }
        } catch (error) {
          console.error("Error al configurar las notificaciones push:", error);
          toast.error("Error al activar notificaciones", {
            description:
              "No se pudieron activar las notificaciones en este dispositivo.",
          });
        } finally {
          isProcessing.current = false;
        }
      };

      setupPushNotifications();
    }
  }, [status]);

  return <>{children}</>;
}
