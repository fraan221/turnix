import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils";
import { User } from "@prisma/client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingWizardSkeleton } from "@/components/skeletons/BookingWizardSkeleton";
import { getCachedBarberProfile } from "@/lib/data";

const PublicProfileClient = dynamic(
  () =>
    import("@/components/public-profile/PublicProfileClient").then(
      (mod) => mod.PublicProfileClient
    ),
  {
    ssr: false,
    loading: () => <ProfileSkeleton />,
  }
);

interface BarberPublicPageProps {
  params: {
    slug: string;
  };
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8 w-full max-w-4xl">
      <Card>
        <CardHeader className="flex flex-col justify-center items-center p-6 space-y-4 text-center bg-card">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="w-48 h-8" />
        </CardHeader>
      </Card>
      <BookingWizardSkeleton />
    </div>
  );
}

async function PublicProfileData({ slug }: { slug: string }) {
  const barbershop = await getCachedBarberProfile(decodeURIComponent(slug));

  if (!barbershop || !barbershop.owner) {
    notFound();
  }

  const owner = barbershop.owner;
  const whatsappUrl = owner.phone
    ? `https://wa.me/${formatPhoneNumberForWhatsApp(owner.phone)}`
    : null;

  const allBarbers: User[] = [
    owner,
    ...barbershop.teamMembers.map((member) => member.user as User),
  ];

  return (
    <PublicProfileClient
      barbershop={barbershop}
      allBarbers={allBarbers}
      whatsappUrl={whatsappUrl}
    />
  );
}

export async function generateMetadata({
  params,
}: BarberPublicPageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);

  const barbershop = await getCachedBarberProfile(slug);

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
  return (
    <main className="flex flex-col items-center p-4 min-h-screen bg-muted/40 md:p-12">
      <Suspense fallback={<ProfileSkeleton />}>
        <PublicProfileData slug={params.slug} />
      </Suspense>
    </main>
  );
}
