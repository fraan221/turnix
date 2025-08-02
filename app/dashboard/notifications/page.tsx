import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotificationList } from "./components/NotificationList";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p>No autorizado</p>;
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
