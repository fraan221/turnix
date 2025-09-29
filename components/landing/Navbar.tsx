"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#beneficios", label: "Beneficios" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#precios", label: "Precios" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-4 inset-x-2 sm:inset-x-4 z-50 max-w-7xl mx-auto rounded-2xl transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-sm border"
          : "bg-transparent border border-transparent"
      )}
    >
      <div className="container flex items-center justify-between h-16 px-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-semibold",
            scrolled ? "text-foreground" : "text-white"
          )}
        >
          <Image
            src="/logo_1.png"
            alt="Logo de Turnix"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="hidden text-black sm:inline-block">Turnix</span>
        </Link>

        <nav className="items-center hidden gap-2 text-xs font-medium md:flex sm:gap-4 sm:text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-primary",
                scrolled
                  ? "text-black/80 hover:text-black"
                  : "text-black/80 hover:text-black"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button asChild>
          <Link href="/register">Empezar Gratis</Link>
        </Button>
      </div>
    </header>
  );
}
