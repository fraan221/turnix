import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { Metadata } from "next";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils";
import { Prisma, User } from "@prisma/client";

const barbershopWithDetails = Prisma.validator<Prisma.BarbershopDefaultArgs>()({
  include: {
    owner: true,
    teamMembers: {
      include: {
        user: true,
      },
    },
    services: {
      orderBy: {
        name: "asc",
      },
    },
  },
});

type BarbershopWithDetails = Prisma.BarbershopGetPayload<
  typeof barbershopWithDetails
>;

interface BarberPublicPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: BarberPublicPageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);

  const barbershop = await prisma.barbershop.findUnique({
    where: { slug },
    include: { owner: { select: { name: true, image: true } } },
  });

  if (!barbershop) {
    return {
      title: "Barbería no encontrada",
      description: "Esta página no existe o fue eliminada.",
    };
  }

  const pageTitle = barbershop.name;
  const description = `Agenda tu turno online en ${pageTitle}. Consulta nuestros servicios y horarios, y reserva tu cita fácilmente a través de Turnix.`;

  return {
    title: `${pageTitle} - Turnos Online | Turnix`,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      images: [
        {
          url: barbershop.owner.image || "/logo.png",
          width: 800,
          height: 600,
          alt: `Logo de ${pageTitle}`,
        },
      ],
    },
  };
}

export default async function BarberPublicPage({
  params,
}: BarberPublicPageProps) {
  const barbershop: BarbershopWithDetails | null =
    await prisma.barbershop.findUnique({
      where: {
        slug: decodeURIComponent(params.slug),
      },
      include: barbershopWithDetails.include,
    });

  if (!barbershop || !barbershop.owner) {
    notFound();
  }

  const owner = barbershop.owner;
  const whatsappUrl = owner.phone
    ? `https://wa.me/${formatPhoneNumberForWhatsApp(owner.phone)}`
    : null;

  const allBarbers: User[] = [
    owner,
    ...barbershop.teamMembers.map((member) => member.user),
  ];

  return (
    <main className="flex flex-col items-center min-h-screen p-4 bg-muted/40 md:p-12">
      <div className="w-full max-w-3xl space-y-8">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col items-center justify-center p-6 text-center bg-card">
            <Avatar className="w-24 h-24 mb-4 border-4 border-background">
              <AvatarImage
                src={owner.image || ""}
                alt={owner.name || "Avatar del barbero"}
              />
              <AvatarFallback>
                {owner.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-bold">
              {barbershop.name}
            </CardTitle>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 transition-colors rounded-full hover:bg-muted"
                aria-label="Contactar por WhatsApp"
              >
                <WhatsAppIcon className="w-6 h-6 text-green-500" />
              </a>
            )}
          </CardHeader>
        </Card>
        <BookingWizard allServices={barbershop.services} barbers={allBarbers} />
      </div>
    </main>
  );
}
