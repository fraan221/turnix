import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Instagram } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="w-full bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Logo de Turnix"
                width={32}
                height={32}
                className="rounded-md"
              />
              <span className="text-lg font-bold font-heading">Turnix</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Gestión simple para barberos ocupados.
            </p>
          </div>

          <div className="text-center md:text-left">
            <h3 className="mb-4 font-semibold">Menú</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#beneficios"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Beneficios
                </Link>
              </li>
              <li>
                <Link
                  href="#testimonios"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Testimonios
                </Link>
              </li>
              <li>
                <Link
                  href="#precios"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Precios
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="mb-4 font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Términos de Servicio
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="mb-4 font-semibold">Newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Tips y novedades para hacer crecer tu barbería.
            </p>
            <div className="flex items-center justify-center mt-4 md:justify-start">
              <Badge variant="secondary">Próximamente</Badge>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Turnix. Construido con ❤️ para
            barberos argentinos.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://www.instagram.com/turnix_app?igsh=ajl0OWVqanBvaXBi"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
