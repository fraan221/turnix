import { Suspense } from "react";
import NotificationListSkeleton from "@/components/skeletons/NotificationListSkeleton";
import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";
import { NotificationList } from "./components/NotificationList";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

async function NotificationsPageContent() {
  const user = await getCurrentUser();
  if (!user) {
    return <p>No autorizado</p>;
  }

  if (user.role !== Role.OWNER) {
    redirect("/dashboard");
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
    <div className="mx-auto max-w-7xl">
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
