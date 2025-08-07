"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";
import { Badge } from "./ui/badge";
import { getNotifications } from "@/actions/notification.actions";
import type { Notification } from "@prisma/client";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session } = useSession();

  const fetchUnreadCount = async () => {
    const result = await getNotifications();
    if (result.notifications) {
      setUnreadCount(result.notifications.filter((n) => !n.read).length);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    window.addEventListener("notificationsUpdated", fetchUnreadCount);

    if (
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
      !session?.user?.id
    ) {
      return;
    }

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channelName = `notifications_${session.user.id}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-notification", (newNotification: Notification) => {
      toast.info(newNotification.message);
      setUnreadCount((prevCount) => prevCount + 1);
      window.dispatchEvent(new Event("new-booking-event"));
    });

    return () => {
      pusherClient.unsubscribe(channelName);
      pusherClient.disconnect();
      window.removeEventListener("notificationsUpdated", fetchUnreadCount);
    };
  }, [session?.user?.id]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Abrir notificaciones"
      asChild
    >
      <Link href="/dashboard/notifications">
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 p-0 text-xs font-bold text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>
      </Link>
    </Button>
  );
}
