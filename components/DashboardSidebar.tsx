"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn, formatPhoneNumberForWhatsApp } from "@/lib/utils";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { UserNav } from "./UserNav";

import {
  Calendar,
  Scissors,
  Clock,
  Users,
  BarChart2,
  User,
  Info,
  Bug,
  Siren,
} from "lucide-react";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);

  const supportPhoneNumber = "+5491160542164";
  const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(
    supportPhoneNumber
  )}`;

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const navLinks = React.useMemo(() => {
    const baseLinks = [
      { href: "/dashboard", label: "Agenda", icon: Calendar },
      { href: "/dashboard/services", label: "Servicios", icon: Scissors },
      { href: "/dashboard/schedule", label: "Horarios", icon: Clock },
      { href: "/dashboard/clients", label: "Clientes", icon: Users },
    ];

    if (userRole === Role.OWNER) {
      return [
        ...baseLinks,
        { href: "/dashboard/team", label: "Equipo", icon: User },
        {
          href: "/dashboard/analytics",
          label: "Estadísticas",
          icon: BarChart2,
        },
      ];
    }

    if (userRole === Role.BARBER) {
      return [
        ...baseLinks,
        {
          href: "/dashboard/my-stats",
          label: "Mis Estadísticas",
          icon: BarChart2,
        },
      ];
    }

    return baseLinks;
  }, [userRole]);

  const handleSupportClick = () => {
    setIsSupportModalOpen(true);
  };

  const handleConfirmSupport = () => {
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
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

        <SidebarContent className="p-2">
          <SidebarMenu>
            {navLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isLinkActive(link.href)}
                  className="px-2 rounded-md"
                >
                  <Link href={link.href}>
                    <link.icon className="size-6" />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <SidebarMenu className="mt-auto">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isLinkActive("/dashboard/help")}
                className="px-2 rounded-md"
              >
                <Link href="/dashboard/help">
                  <Info className="size-6" />
                  <span>Ayuda</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSupportClick}
                className="px-2 rounded-md"
              >
                <Bug className="size-6" />
                <span>Soporte</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="flex-col items-stretch gap-2 p-3">
          <UserNav />
        </SidebarFooter>
      </Sidebar>

      <AlertDialog
        open={isSupportModalOpen}
        onOpenChange={setIsSupportModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-500">
              <Siren className="w-6 h-6 mr-2" /> VAS A SER REDIRIGIDO!
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4">
              Estás a punto de ser redirigido a <strong>WhatsApp</strong> para
              contactar con soporte. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSupport}>
              <WhatsAppIcon className="w-4 h-4 mr-2" />
              Sí, continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
