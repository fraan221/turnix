import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://turnix.app'),
  title: "Turnix - Agenda Online y Sistema de Turnos para Barberías",
  description: "Simplifica la gestión de tu barbería con Turnix. Ofrece a tus clientes una agenda online para reservar turnos 24/7. Ideal para barberos y estilistas.",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="es">
      <head />
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster richColors />
        </SessionProvider>

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}