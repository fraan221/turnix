import { Suspense } from "react";
import NotificationListSkeleton from "@/components/skeletons/NotificationListSkeleton";
import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";
import { NotificationList } from "./components/NotificationList";
import { MarkAllReadButton } from "./components/MarkAllReadButton";

async function NotificationsPageContent() {
  const user = await getCurrentUser();
  if (!user) {
    return <p>No autorizado</p>;
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            Notificaciones
          </h1>
          <p className="mt-2 text-muted-foreground">
            Mantenete al tanto de la actividad y los turnos de tu barbería.
          </p>
        </div>
        {hasUnread && <MarkAllReadButton />}
      </div>

      <NotificationList initialNotifications={notifications} />
    </div>
  );
}

export default async function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationListSkeleton />}>
      <NotificationsPageContent />
    </Suspense>
  );
}
