import "./globals.css";
import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { cn } from "@/lib/utils";
import { inter, montserrat } from "./fonts";
import { LoaderProvider } from "@/context/LoaderContext";

const siteUrl = "https://www.turnix.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Turnix - Software de Agenda de Turnos para Barberías",
    template: `%s | Turnix`,
  },
  description:
    "Turnix es el software de gestión y agenda de turnos online diseñado para barberos y barberías en Argentina. Simplifica tu trabajo, reduce ausencias y potencia tu negocio.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Turnix - El Software de Gestión para tu Barbería",
    description:
      "Agenda de turnos online, recordatorios automáticos y más. ¡Prueba gratis por 14 días!",
    url: siteUrl,
    siteName: "Turnix",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_AR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Turnix - El Software de Gestión para tu Barbería",
    description:
      "El software para barberías que te ayuda a organizar tu negocio y ofrecer la mejor experiencia a tus clientes.",
    images: [`${siteUrl}/og-image.png`],
  },

  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
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
          <LoaderProvider>
            {children}
            <Toaster richColors />
          </LoaderProvider>
        </SessionProvider>

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
