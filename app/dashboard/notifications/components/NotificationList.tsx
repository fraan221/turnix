"use client";

import { useMemo } from "react";
import { formatDistanceToNow, isThisWeek, isThisMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Notification } from "@prisma/client";

interface NotificationListProps {
  initialNotifications: Notification[];
}

const groupNotifications = (notifications: Notification[]) => {
  const groups = {
    estaSemana: [] as Notification[],
    esteMes: [] as Notification[],
    anteriores: [] as Notification[],
  };

  notifications.forEach((n) => {
    const notificationDate = new Date(n.createdAt);
    if (isThisWeek(notificationDate, { weekStartsOn: 1 })) {
      groups.estaSemana.push(n);
    } else if (isThisMonth(notificationDate)) {
      groups.esteMes.push(n);
    } else {
      groups.anteriores.push(n);
    }
  });

  return groups;
};

export function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const groupedNotifications = useMemo(
    () => groupNotifications(initialNotifications),
    [initialNotifications]
  );

  const renderSection = (title: string, notifications: Notification[]) => {
    if (notifications.length === 0) return null;

    return (
      <div key={title}>
        <h2 className="px-4 py-2 text-lg font-semibold tracking-tight font-heading">
          {title}
        </h2>
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "p-4 text-sm border-l-4 transition-colors",
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
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {initialNotifications.length > 0 ? (
        <>
          {renderSection("Esta semana", groupedNotifications.estaSemana)}
          {renderSection("Este mes", groupedNotifications.esteMes)}
          {renderSection("Anteriores", groupedNotifications.anteriores)}
        </>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-sm text-center text-muted-foreground">
            No tienes notificaciones. ¡Todo al día!
          </p>
        </div>
      )}
    </div>
  );
}
