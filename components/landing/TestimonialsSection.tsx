import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "Turnix me devolvió las noches. Antes contestaba WhatsApps hasta la madrugada, ahora la agenda se llena sola y yo descanso. Es un antes y un después para mi negocio.",
    name: "Carlos",
    barbershop: "La Barbería de Carlos, Palermo",
    avatar: "/images/avatars/avatar-1.png", // Placeholder path
  },
  {
    quote:
      "Lo mejor son las estadísticas. Ahora sé qué servicios me dan más plata y qué clientes son los más fieles. Dejé de adivinar y empecé a tomar decisiones con datos reales.",
    name: "Javier",
    barbershop: "Javi's Cuts, Villa Crespo",
    avatar: "/images/avatars/avatar-2.png", // Placeholder path
  },
  {
    quote:
      "Tener a todo el equipo en la misma app nos cambió el día a día. Cero desorden con los turnos y las comisiones salen solas. Mis barberos están más contentos y yo también.",
    name: "Sofía",
    barbershop: "The Modern Shave, Recoleta",
    avatar: "/images/avatars/avatar-3.png", // Placeholder path
  },
  // Podemos añadir más testimonios para hacer el carrusel más largo
  {
    quote:
      "La página para que los clientes reserven es súper simple y funciona de diez. Me llegan los turnos directo al celu, increíble.",
    name: "Lucas",
    barbershop: "Barbería Clásica, San Telmo",
    avatar: "/images/avatars/avatar-4.png", // Placeholder path
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonios" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter font-heading sm:text-5xl">
              Amado por barberos en toda Argentina
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
                  <div className="flex items-center gap-4 pt-6 mt-6 border-t">
                    <Avatar>
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.name}
                      />
                      <AvatarFallback>
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.barbershop}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
