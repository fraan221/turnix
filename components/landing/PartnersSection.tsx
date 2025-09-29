import Image from "next/image";

const partners = [
  { name: "Overcoming", logo: "/images/partners/barberia_1.png" },
  { name: "Yankee Barber", logo: "/images/partners/barberia_2.png" },
  { name: "Break Barber", logo: "/images/partners/barberia_3.png" },
  { name: "Lupa Estudio", logo: "/images/partners/barberia_4.png" },
];

export function PartnersSection() {
  return (
    <section className="w-full py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <p className="text-lg font-semibold tracking-wide text-muted-foreground">
            Barberías reales, resultados reales
          </p>
          <div className="relative w-full max-w-5xl mt-4 overflow-hidden">
            <div className="flex w-max animate-marquee">
              {[...partners, ...partners].map((partner, index) => (
                <div key={index} className="flex-shrink-0 w-48 mx-6">
                  <Image
                    src={partner.logo}
                    alt={`Logo de ${partner.name}`}
                    width={158}
                    height={48}
                    className="object-contain w-full h-14"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
