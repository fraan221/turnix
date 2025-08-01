"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { User, LogOut, Settings2, ExternalLink } from "lucide-react";

function UserButtonSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    </div>
  );
}

export default function UserButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <UserButtonSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const userRole = session.user.role;
  const barbershopSlug = session.user.barbershop?.slug;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative w-8 h-8 rounded-full">
            <Avatar className="w-8 h-8">
              {session.user.image && (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                />
              )}
              <AvatarFallback>
                {session.user.name?.charAt(0).toUpperCase() || (
                  <User className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {session.user.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {userRole === "OWNER" && barbershopSlug && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/${barbershopSlug}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                <span>Ver perfil público</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/dashboard/settings">
              <Settings2 className="w-4 h-4 mr-2" />
              <span>Ajustes</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center w-full text-red-500 cursor-pointer focus:bg-red-50 focus:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
