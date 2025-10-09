"use server";

import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";

interface SubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function saveSubscriptionToDb(
  subscription: SubscriptionJSON
): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Acción no autorizada." };
  }

  try {
    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!endpoint || !p256dh || !auth) {
      return {
        success: false,
        message: "La suscripción no es válida.",
      };
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh,
        auth,
        userId: user.id,
      },
      create: {
        endpoint,
        p256dh,
        auth,
        userId: user.id,
      },
    });

    return { success: true, message: "Suscripción guardada correctamente." };
  } catch (error) {
    console.error("Error al guardar la suscripción push:", error);
    return {
      success: false,
      message: "No se pudo guardar la suscripción en el servidor.",
    };
  }
}
