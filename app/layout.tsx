import "./globals.css";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { cn } from "@/lib/utils";
import { inter, montserrat } from "./fonts";

export const metadata: Metadata = {
  metadataBase: new URL("https://turnix.app"),
  title: "Turnix - Agenda Online y Sistema de Turnos para Barberías",
  description:
    "Simplifica la gestión de tu barbería con Turnix. Ofrece a tus clientes una agenda online para reservar turnos 24/7. Ideal para barberos y estilistas.",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          montserrat.variable
        )}
      >
        <SessionProvider>
          {children}
          <Toaster richColors />
        </SessionProvider>

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
