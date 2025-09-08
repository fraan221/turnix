"use server";

import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });
    return { notifications };
  } catch (error) {
    return { error: "No se pudieron obtener las notificaciones." };
  }
}

export async function markNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    revalidatePath("/dashboard");
    return { success: "Notificaciones marcadas como leídas." };
  } catch (error) {
    return { error: "No se pudieron marcar las notificaciones." };
  }
}
