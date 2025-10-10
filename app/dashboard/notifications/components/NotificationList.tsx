"use client";

import { useMemo, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  isDateInThisWeek,
  isDateInThisMonth,
  formatDistanceFromNow,
} from "@/lib/date-helpers";
import { cn } from "@/lib/utils";
import { Bell, BellOff, Clock } from "lucide-react";
import type { Notification } from "@prisma/client";
import { markNotificationsAsRead } from "@/actions/notification.actions";

interface NotificationListProps {
  initialNotifications: Notification[];
}

interface GroupedNotifications {
  estaSemana: Notification[];
  esteMes: Notification[];
  anteriores: Notification[];
}

const groupNotifications = (
  notifications: Notification[]
): GroupedNotifications => {
  const groups: GroupedNotifications = {
    estaSemana: [],
    esteMes: [],
    anteriores: [],
  };

  notifications.forEach((n) => {
    const notificationDate = new Date(n.createdAt);
    if (isDateInThisWeek(notificationDate)) {
      groups.estaSemana.push(n);
    } else if (isDateInThisMonth(notificationDate)) {
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const source = searchParams.get("source");

    if (source === "notification") {
      startTransition(() => {
        markNotificationsAsRead();
      });

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("source");
      const newPath = `${window.location.pathname}?${newParams.toString()}`;
      router.replace(newPath, { scroll: false });
    }
  }, [searchParams, router, startTransition]);

  const renderSection = (title: string, notifications: Notification[]) => {
    if (notifications.length === 0) return null;

    return (
      <section key={title} className="space-y-3">
        <div className="px-4 md:px-0">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {title}
          </h2>
        </div>

        <div className="space-y-2">
          {notifications.map((n) => (
            <article
              key={n.id}
              className={cn(
                "group relative px-4 py-3 border-l-4 transition-all duration-200 hover:bg-accent/50",
                n.read
                  ? "border-transparent bg-muted/30"
                  : "bg-primary/5 border-primary"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 shrink-0",
                    n.read ? "text-muted-foreground/50" : "text-primary"
                  )}
                >
                  {n.read ? (
                    <BellOff className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      n.read
                        ? "text-muted-foreground"
                        : "font-medium text-foreground"
                    )}
                  >
                    {n.message}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <time dateTime={new Date(n.createdAt).toISOString()}>
                      {formatDistanceFromNow(n.createdAt)}
                    </time>
                  </div>
                </div>
              </div>

              {!n.read && (
                <div className="absolute top-3 right-4">
                  <span className="flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-primary"></span>
                  </span>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    );
  };

  if (initialNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="p-4 mb-4 rounded-full bg-muted">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-semibold text-foreground">
          No tenés notificaciones
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Cuando tengas turnos nuevos, cambios o recordatorios, te avisaremos
          acá.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-6 space-y-8">
      {renderSection("Esta semana", groupedNotifications.estaSemana)}
      {renderSection("Este mes", groupedNotifications.esteMes)}
      {renderSection("Anteriores", groupedNotifications.anteriores)}
    </div>
  );
}
