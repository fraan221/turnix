import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-muted/40 md:p-12">
      <Image
        src="/images/404-image.svg"
        alt="Ilustración de página no encontrada"
        width={250}
        height={250}
        className="mb-4"
      />

      <div className="flex flex-col items-center justify-center max-w-lg space-y-6">
        <p className="text-muted-foreground">
          Lo sentimos, la página que estás buscando no existe, fue eliminada o
          ha cambiado de lugar.
        </p>
        <Button asChild size="lg">
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </div>
    </main>
  );
}
