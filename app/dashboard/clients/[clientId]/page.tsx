import { getUserForSettings } from "@/lib/data";
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
  const currentUser = await getUserForSettings();
  if (!currentUser) return notFound();

  const barbershopId =
    currentUser?.ownedBarbershop?.id ||
    currentUser?.teamMembership?.barbershopId;

  if (!barbershopId) {
    return notFound();
  }

  try {
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

    if (currentUser.role === Role.BARBER) {
      const hasAttendedClient = client.bookings.some(
        (booking) => booking.barberId === currentUser.id
      );

      if (!hasAttendedClient) {
        return notFound();
      }
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
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold rounded-full bg-primary/10 text-primary">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="grid gap-1">
              <h1 className="text-2xl font-bold tracking-tight font-heading md:text-3xl">
                {client.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {client.phone}
              </p>
            </div>
          </div>
          <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 transition-shadow hover:shadow-md">
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
            />
          </div>

          <BookingHistory
            turnosFuturos={turnosFuturos}
            historialDeTurnos={historialDeTurnos}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching client details:", error);
    return notFound();
  }
}
