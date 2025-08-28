import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NotificationList } from "./components/NotificationList";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p>No autorizado</p>;
  }

  if (session.user.role !== Role.OWNER) {
    redirect("/dashboard");
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <NotificationList initialNotifications={notifications} />
    </div>
  );
}
