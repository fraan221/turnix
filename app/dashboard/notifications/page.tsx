import { Suspense } from "react";
import NotificationListSkeleton from "@/components/skeletons/NotificationListSkeleton";
import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";
import { NotificationList } from "./components/NotificationList";

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

  return (
    <div className="max-w-6xl mx-auto">
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
