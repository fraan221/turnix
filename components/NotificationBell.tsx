"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  getNotifications,
  markNotificationsAsRead,
} from "@/actions/notification.actions";
import { pusherClient } from "@/lib/pusher-client";

interface NotificationPayload {
  id: string;
  message: string;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session } = useSession();

  const fetchUnreadCount = useCallback(async () => {
    const result = await getNotifications();
    if (result.notifications) {
      setUnreadCount(result.notifications.filter((n) => !n.read).length);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    window.addEventListener("notificationsUpdated", fetchUnreadCount);

    return () => {
      window.removeEventListener("notificationsUpdated", fetchUnreadCount);
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const channelName = `notifications_${session.user.id}`;
    const channel = pusherClient.subscribe(channelName);

    const handleNewNotification = (newNotification: NotificationPayload) => {
      console.log("NOTIFICACION RECIBIDA EN PUSHER FRONTEND:", newNotification);
      toast.info(newNotification.message);
      setUnreadCount((prev) => prev + 1);
      window.dispatchEvent(new Event("new-booking-event"));
    };

    channel.bind("new-notification", handleNewNotification);

    return () => {
      channel.unbind("new-notification", handleNewNotification);
      // Solo desuscribirse cuando el componente se desmonte del todo o el ID de usuario cambie
      pusherClient.unsubscribe(channelName);
    };
  }, [session?.user?.id]);

  const handleBellClick = () => {
    if (unreadCount > 0) {
      markNotificationsAsRead();
      setUnreadCount(0);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Abrir notificaciones"
      asChild
      onClick={handleBellClick}
    >
      <Link href="/dashboard/notifications">
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="flex absolute top-0 right-0 justify-center items-center p-0 w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full shadow-sm transform translate-x-1/2 -translate-y-1/2">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>
      </Link>
    </Button>
  );
}
