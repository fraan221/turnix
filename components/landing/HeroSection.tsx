import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SocialProof = () => (
  <div className="flex items-center gap-4 px-3 py-1.5 border rounded-full bg-muted w-fit">
    <div className="flex -space-x-2 overflow-hidden">
      <Avatar className="w-6 h-6 border-2 border-background">
        <AvatarImage
          src="/images/partners/barberia_1.png"
          alt="Overcoming Logo"
        />
        <AvatarFallback>B1</AvatarFallback>
      </Avatar>
      <Avatar className="w-6 h-6 border-2 border-background">
        <AvatarImage
          src="/images/partners/barberia_2.png"
          alt="Yankee Barber Logo"
        />
        <AvatarFallback>B2</AvatarFallback>
      </Avatar>
      <Avatar className="w-6 h-6 border-2 border-background">
        <AvatarImage
          src="/images/partners/barberia_3.png"
          alt="Break Barber Logo"
        />
        <AvatarFallback>B3</AvatarFallback>
      </Avatar>
      <Avatar className="w-6 h-6 border-2 border-background">
        <AvatarImage
          src="/images/partners/barberia_4.png"
          alt="Lupa Estudio Logo"
        />
        <AvatarFallback>+1</AvatarFallback>
      </Avatar>
      <Avatar className="w-6 h-6 border-2 border-background">
        <AvatarImage
          src="/images/partners/barberia_5.png"
          alt="HAIRVANA SALON Logo"
        />
        <AvatarFallback>+1</AvatarFallback>
      </Avatar>
    </div>
    <span className="pr-2 text-sm font-medium text-muted-foreground">
      +6 barberías usan Turnix diariamente
    </span>
  </div>
);

export function HeroSection() {
  return (
    <section className="w-full pt-32 pb-12 mx-auto max-w-7xl md:pt-48 md:pb-24">
      <div className="container px-4 md:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <SocialProof />
            <h1 className="text-4xl font-bold tracking-tighter font-heading sm:text-5xl md:text-6xl text-balance">
              ¿Cuántos clientes perdiste hoy?
            </h1>
            <p className="max-w-xl text-muted-foreground md:text-xl text-balance">
              Con Turnix, cada cliente que te busca, reserva.
            </p>
            <div className="flex flex-col items-center gap-4 mt-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Empezar Gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              14 días gratis • Sin tarjeta
            </p>
          </div>

          <div className="flex justify-center">
            <Image
              src="/images/screenshot-dashboard.png"
              alt="Captura de pantalla del dashboard de Turnix"
              width={700}
              height={371}
              priority
              className="w-full h-auto border rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
