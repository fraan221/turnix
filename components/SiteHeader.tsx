"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "./NotificationBell";

const pageTitles: { [key: string]: string } = {
  "/dashboard/services": "Servicios",
  "/dashboard/schedule": "Horarios",
  "/dashboard/clients": "Clientes",
  "/dashboard/settings": "Ajustes",
  "/dashboard/notifications": "Notificaciones",
  "/dashboard/#": "Equipo",
  "/dashboard/##": "Estadísticas",
  "/dashboard": "Agenda",
};

export function SiteHeader() {
  const pathname = usePathname();

  const getTitle = () => {
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    const matchingKey = Object.keys(pageTitles)
      .sort((a, b) => b.length - a.length)
      .find((key) => pathname.startsWith(key));

    return matchingKey ? pageTitles[matchingKey] : "Dashboard";
  };

  const title = getTitle();

  return (
    <header className="flex h-[57px] shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="hidden h-4 mx-2 md:block"
          />
          <h1 className="text-xl font-bold tracking-tight font-heading">
            {title}
          </h1>
        </div>
        <div>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
