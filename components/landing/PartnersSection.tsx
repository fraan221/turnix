import Image from "next/image";
import { getPartners } from "@/lib/data";

export async function PartnersSection() {
  const partners = await getPartners();

  if (partners.length === 0) return null;

  return (
    <section className="py-12 w-full md:py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col justify-center items-center space-y-4 text-center">
          <h1 className="text-lg font-semibold tracking-wide text-muted-foreground font-heading">
            Barberías reales, resultados reales
          </h1>
          <div className="overflow-hidden relative mt-6 w-full max-w-5xl">
            <div className="flex w-max animate-marquee">
              {[...partners, ...partners].map((partner, index) => (
                <div
                  key={`${partner.slug}-${index}`}
                  className="flex-shrink-0 mx-4 w-48"
                >
                  <Image
                    src={partner.logoUrl}
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
