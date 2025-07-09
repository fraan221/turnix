import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Turnix",
  description: "La plataforma definitiva para la gestión de tu barbería.",
}

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta name="google-site-verification" content="yZ3o7ESLpcWcIsLUE31bPQm9oRe4xk2SSDDGI_l5X1Q" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster richColors />
        </SessionProvider>
      </body>
    </html>
  )
}