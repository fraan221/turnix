import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative flex items-center justify-center w-full h-screen overflow-hidden">
      <Image
        src="/images/hero-background.jpg"
        alt="Sillón de barbero en una barbería profesional"
        fill
        className="object-cover"
        priority
        placeholder="blur"
        blurDataURL="/images/hero-background.jpg"
      />
      <div className="absolute inset-0 z-10 bg-black/60" />
      <div className="container relative z-20 px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="flex flex-col items-center max-w-3xl gap-6 mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tighter font-heading sm:text-5xl md:text-6xl lg:text-7xl text-balance">
              ¿Cuántos clientes perdiste hoy?
            </h1>
            <p className="max-w-[700px] text-white/80 md:text-xl text-balance">
              Con Turnix, cada cliente que te busca, reserva. Sin vueltas, sin
              pérdidas.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 mt-4">
            <Button asChild size="lg">
              <Link href="/register">Empezar Gratis</Link>
            </Button>
            <p className="text-xs text-white/70">
              14 días gratis • Sin tarjeta
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
