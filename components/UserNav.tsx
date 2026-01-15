"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LogOut,
  Settings2,
  ExternalLink,
  User,
  ChevronsUpDown,
  Crown,
} from "lucide-react";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";

export function UserNav() {
  const { data: session } = useSession();
  const isPro = useSubscriptionStore((state) => state.isPro);
  const isHydrated = useSubscriptionStore((state) => state.isHydrated);

  if (!session?.user) {
    return null;
  }

  const { user } = session;
  const userRole = user.role;
  const barbershopSlug = user.barbershop?.slug;
  
  const isProUser = isHydrated 
    ? isPro() 
    : user.subscription?.status === "authorized";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full data-[state=open]:bg-accent"
            >
              <div className="overflow-hidden relative flex-shrink-0 w-8 h-8 rounded-lg">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "Avatar"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex justify-center items-center w-full h-full rounded-md bg-muted">
                    {user.name?.charAt(0).toUpperCase() || (
                      <User className="size-4" />
                    )}
                  </div>
                )}
              </div>
              <div className="grid flex-1 text-sm leading-tight text-left">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  {user.name}
                  {isProUser && (
                    <Badge className="h-4 px-1.5 py-0 text-[10px] font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                      PRO
                    </Badge>
                  )}
                </span>
                <span className="text-xs truncate text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            side="top"
            align="end"
            sideOffset={12}
          >
            <DropdownMenuItem asChild className="p-2 cursor-pointer">
              <Link href={`/${barbershopSlug}`} target="_blank">
                <ExternalLink className="mr-2 w-4 h-4" />
                <span>Ver perfil público</span>
              </Link>
            </DropdownMenuItem>

            {userRole === "OWNER" && (
              <DropdownMenuItem asChild className="p-2 cursor-pointer">
                <Link href="/dashboard/billing">
                  <Crown className={`w-4 h-4 mr-2 ${isProUser ? "fill-amber-500 stroke-amber-600" : "stroke-primary"}`} />
                  <span className={isProUser ? "font-medium text-amber-600" : "text-primary"}>
                    {isProUser ? "Plan PRO" : "Suscripción"}
                  </span>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild className="p-2 cursor-pointer">
              <Link href="/dashboard/settings">
                <Settings2 className="mr-2 w-4 h-4" />
                <span>Ajustes</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-red-500 cursor-pointer focus:bg-red-50 focus:text-red-600"
            >
              <LogOut className="mr-2 w-4 h-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
