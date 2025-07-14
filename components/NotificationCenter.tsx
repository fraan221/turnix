"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Bell, CheckCheck } from "lucide-react";
import {
  getNotifications,
  markNotificationsAsRead,
} from "@/actions/notification.actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const fetchInitialNotifications = async () => {
      const result = await getNotifications();
      if (result.notifications) {
        setNotifications(result.notifications);
      }
    };
    fetchInitialNotifications();

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
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      pusherClient.unsubscribe(channelName);
      pusherClient.disconnect();
    };
  }, [session?.user?.id]);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await markNotificationsAsRead();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir notificaciones">
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 p-0 text-xs font-bold text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full shadow-sm animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="w-4 h-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="p-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-3 mb-2 text-sm border-b border-transparent rounded-md",
                    !n.read && "bg-slate-100 border-slate-200"
                  )}
                >
                  <p className={cn("font-medium", !n.read && "font-bold")}>
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm text-center text-muted-foreground">
              No tienes notificaciones nuevas.
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
