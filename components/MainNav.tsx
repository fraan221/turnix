"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Calendar, Scissors, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";

function AnimatedMenuIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-4 h-3">
      <span
        className={cn(
          "bg-foreground absolute block h-0.5 w-full transition-all duration-200",
          isOpen ? "top-[50%] rotate-45" : "top-[25%]"
        )}
      />
      <span
        className={cn(
          "bg-foreground absolute block h-0.5 w-full transition-all duration-200",
          isOpen ? "top-[50%] -rotate-45" : "top-[75%]"
        )}
      />
    </div>
  );
}

const navLinks = [
  { href: "/dashboard", label: "Agenda", icon: Calendar },
  { href: "/dashboard/services", label: "Servicios", icon: Scissors },
  { href: "/dashboard/schedule", label: "Horarios", icon: Clock },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
];

export function MainNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex items-center">
      <div className="lg:hidden">
        <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <PopoverTrigger asChild>
            <button className="flex flex-row items-center gap-2 py-4">
              <AnimatedMenuIcon isOpen={isMenuOpen} />
              <span className="text-lg font-semibold">Menú</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-screen h-screen p-0 m-0 bg-background/95 backdrop-blur-sm"
            align="start"
            side="top"
            sideOffset={0}
          >
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-12 px-6 py-12">
                <div className="flex flex-col gap-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    Menú
                  </div>
                  <div className="flex flex-col gap-3">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "text-2xl font-medium transition-colors hover:text-primary",
                          pathname === link.href
                            ? "text-primary"
                            : "text-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <nav className="items-center hidden gap-2 text-sm font-medium lg:flex">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-accent",
                pathname === link.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
