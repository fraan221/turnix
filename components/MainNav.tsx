"use client";

import Image from "next/image";
import { Separator } from "@/components/ui/separator"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Menu, Scissors, Clock, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Agenda", icon: Calendar },
  { href: "/dashboard/services", label: "Servicios", icon: Scissors },
  { href: "/dashboard/schedule", label: "Horarios", icon: Clock },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
];

interface MainNavProps {
  barbershopName: string | null;
}

export function MainNav({ barbershopName }: MainNavProps) {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="sr-only">Menú Principal</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-4 py-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <>
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-black hover:bg-gray-100 hover:text-gray-900",
                      pathname === link.href
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                  <Separator />
                </>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" className="flex items-center gap-2">
        {barbershopName && (
          <h1 className="hidden text-xl font-bold sm:block">{barbershopName}</h1>
        )}
      </Link>
    </div>
  );
}