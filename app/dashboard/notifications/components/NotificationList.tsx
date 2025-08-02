"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { markNotificationsAsRead } from "@/actions/notification.actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Notification } from "@prisma/client";

interface NotificationListProps {
  initialNotifications: Notification[];
}

export function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const result = await markNotificationsAsRead();

    if (result?.error) {
      toast.error("Error", { description: result.error });
    }
    if (result?.success) {
      toast.success("Éxito", { description: result.success });
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <div className="flex items-center justify-between p-4 border-b">
          Centro de Notificaciones
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[60vh] p-1">
          {notifications.length > 0 ? (
            <div className="p-3 space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-4 text-sm border-l-4 rounded-r-md transition-colors",
                    n.read
                      ? "border-transparent bg-background"
                      : "bg-primary/5 border-primary"
                  )}
                >
                  <p
                    className={cn(
                      "font-medium text-muted-foreground",
                      !n.read && "font-semibold text-foreground"
                    )}
                  >
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-sm text-center text-muted-foreground">
              No tienes notificaciones. ¡Todo al día!
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
