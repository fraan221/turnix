import { Card, CardContent } from "@/components/ui/card";
import { Instagram } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const testimonials = [
  {
    quote:
      "La página súper compleja y rápida, fácil para mis clientes e amigos de agendar muchísimimos de mis clientes me lo agradecieron y Turnix fue una antes y después para poder estar más organizado además que tiene todo para poder estar bien.",
    name: "Santiago",
    barbershop: "Overcoming, Berazategui",
    avatar: "/images/partners/barberia_1.png",
    instagramUrl:
      "https://www.instagram.com/overcoming.salon?igsh=eGNxM3VyZ3YyY21i",
  },
  {
    quote:
      "La página va genial!! Rapida, sencilla y accesible. Nos facilito mucho la gestión de turnos ✨💈✅",
    name: "Mariano",
    barbershop: "Yankee Barber, Isidro Casanova",
    avatar: "/images/partners/barberia_2.png",
    instagramUrl:
      "https://www.instagram.com/_yankeebarber?igsh=MTlpeDJsd3hkdXpxeg==",
  },
  {
    quote:
      "Me aporto claridad y control del dinero que voy a tener dia a dia. Los clientes dicen que es súper fácil de usar. Y le aporta profesionalismo a mi trabajo",
    name: "Erik",
    barbershop: "Break Barber, Azul",
    avatar: "/images/partners/barberia_3.png",
    instagramUrl:
      "https://www.instagram.com/break.barber?igsh=MWpnajR3d3U3NHYzOA==",
  },
  {
    quote:
      "Turnix es una agenda que simplificó y agilizó mi trabajo, muy sencilla y fácil de acceder tanto para mí como para mis clientes, muy completa y eficaz",
    name: "Lupa",
    barbershop: "Lupa Estudio, Berazategui",
    avatar: "/images/partners/barberia_4.png",
    instagramUrl:
      "https://www.instagram.com/lupa_estudio?igsh=MXhvaWVqdWRrcWx5Mg==",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonios" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter font-heading sm:text-5xl">
              Barberos que confían en Turnix
            </h2>
          </div>
        </div>

        <div className="relative w-full max-w-6xl mx-auto mt-12 overflow-hidden">
          <div className="flex w-max animate-marquee [--duration:60s] hover:[animation-play-state:paused]">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <Card
                key={index}
                className="flex flex-col flex-shrink-0 w-[350px] mx-4"
              >
                <CardContent className="flex flex-col flex-grow p-6">
                  <blockquote className="flex-grow pl-4 text-lg italic border-l-4 border-primary text-muted-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <Link
                    href={testimonial.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t">
                      <div className="relative w-10 h-10">
                        <Image
                          src={testimonial.avatar}
                          alt={`Logo de ${testimonial.barbershop}`}
                          fill
                          className="object-cover rounded-full"
                        />
                      </div>
                      <div className="flex items-center justify-between flex-grow gap-2">
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.barbershop}
                          </p>
                        </div>
                        <Instagram className="w-4 h-4 transition-colors text-muted-foreground group-hover:text-primary" />
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
