"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { UserNav } from "./UserNav";

import {
  Calendar,
  Scissors,
  Clock,
  Users,
  BarChart2,
  User,
} from "lucide-react";

const mainNavLinks = [
  { href: "/dashboard", label: "Agenda", icon: Calendar },
  { href: "/dashboard/services", label: "Servicios", icon: Scissors },
  { href: "/dashboard/schedule", label: "Horarios", icon: Clock },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/team", label: "Equipo", icon: User },
  { href: "/dashboard/analytics", label: "Estadísticas", icon: BarChart2 },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const navLinks = mainNavLinks.filter((link) => {
    if (userRole === Role.BARBER) {
      return !["/dashboard/team", "/dashboard/analytics"].includes(link.href);
    }
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          {session?.user?.barbershop?.name && (
            <>
              <Image
                src="/logo.png"
                alt="Logo de Turnix"
                width={30}
                height={30}
              />
              <span className="text-lg font-semibold truncate">
                {session.user.barbershop.name}
              </span>
            </>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <TooltipProvider delayDuration={0}>
          <SidebarMenu>
            {navLinks.map((link) => (
              <SidebarMenuItem key={link.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      isActive={isLinkActive(link.href)}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          (link as any).disabled &&
                            "pointer-events-none opacity-50"
                        )}
                      >
                        <link.icon className="size-5" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    {link.label}
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </TooltipProvider>
      </SidebarContent>

      <SidebarFooter className="flex-col items-stretch gap-2 p-3">
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
