import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils";
import { Prisma, User } from "@prisma/client";
import { PublicProfileClient } from "@/components/public-profile/PublicProfileClient";

const barbershopWithDetails = Prisma.validator<Prisma.BarbershopDefaultArgs>()({
  include: {
    owner: {
      include: {
        workingHours: {
          include: {
            blocks: true,
          },
          orderBy: {
            dayOfWeek: "asc",
          },
        },
      },
    },
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

export type BarbershopWithDetails = Prisma.BarbershopGetPayload<
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
    select: { name: true, image: true, owner: { select: { image: true } } },
  });

  if (!barbershop) {
    return {
      title: "Barbería no encontrada",
      description: "Esta página no existe o fue eliminada.",
    };
  }

  const pageTitle = barbershop.name;
  const description = `Agenda tu turno online en ${pageTitle}. Consulta nuestros servicios y horarios, y reserva tu cita fácilmente a través de Turnix.`;
  const imageUrl = barbershop.image || barbershop.owner.image || "/logo.png";

  return {
    title: `${pageTitle} - Turnos Online | Turnix`,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      images: [
        {
          url: imageUrl,
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
  const barbershop = await prisma.barbershop.findUnique({
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
      <PublicProfileClient
        barbershop={barbershop}
        allBarbers={allBarbers}
        whatsappUrl={whatsappUrl}
      />
    </main>
  );
}
