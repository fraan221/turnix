import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ClientNotesForm } from "./ClientNotesForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils";
import { Role } from "@prisma/client";
import { BookingHistory } from "./BookingHistory";
import { notFound } from "next/navigation";

interface ClientDetailPageProps {
  params: { clientId: string };
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) return notFound();

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: true,
      teamMembership: true,
    },
  });

  const barbershopId =
    currentUser?.ownedBarbershop?.id ||
    currentUser?.teamMembership?.barbershopId;

  if (!barbershopId) {
    return notFound();
  }

  const client = await prisma.client.findFirst({
    where: {
      id: params.clientId,
      barbershopId: barbershopId,
    },
    include: {
      bookings: {
        include: {
          service: true,
          barber: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
      },
    },
  });

  if (!client) {
    return notFound();
  }

  const now = new Date();
  const turnosFuturos = client.bookings
    .filter((b) => new Date(b.startTime) > now && b.status === "SCHEDULED")
    .reverse();
  const historialDeTurnos = client.bookings.filter(
    (b) => new Date(b.startTime) <= now || b.status !== "SCHEDULED"
  );
  const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(client.phone)}`;

  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight font-heading md:text-3xl">
            Ficha de Cliente: {client.name}
          </h1>
        </div>
        <Link href={whatsappUrl} target="_blank">
          <Button className="gap-2">
            <WhatsAppIcon />
            Contactar
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ClientNotesForm
            clientId={client.id}
            currentNotes={client.notes}
            clientName={client.name}
          />
        </div>

        <BookingHistory
          turnosFuturos={turnosFuturos as any}
          historialDeTurnos={historialDeTurnos as any}
          isOwnerView={currentUser.role === Role.OWNER}
        />
      </div>
    </div>
  );
}
