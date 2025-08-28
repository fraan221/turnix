import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ClientNotesForm } from "./ClientNotesForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, History, User } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatPhoneNumberForWhatsApp, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Booking, BookingStatus, Role, Service } from "@prisma/client";
import { notFound } from "next/navigation";

interface ClientDetailPageProps {
  params: { clientId: string };
}

type BookingWithDetails = Booking & {
  service: Service;
  barber: {
    name: string | null;
  };
};

function BookingListItem({
  booking,
  formatString,
  isOwnerView,
}: {
  booking: BookingWithDetails;
  formatString: string;
  isOwnerView: boolean;
}) {
  const statusMap = {
    [BookingStatus.COMPLETED]: {
      text: "Completado",
      className: "bg-green-100 text-green-800",
    },
    [BookingStatus.CANCELLED]: {
      text: "Cancelado",
      className: "bg-red-100 text-red-800",
    },
    [BookingStatus.SCHEDULED]: {
      text: "Próximo",
      className: "bg-blue-100 text-blue-800",
    },
  };

  const status = statusMap[booking.status];

  return (
    <li
      key={booking.id}
      className={cn("text-sm", booking.status === "CANCELLED" && "opacity-60")}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{booking.service.name}</p>
        {status && <Badge className={status.className}>{status.text}</Badge>}
      </div>
      <p className="capitalize text-muted-foreground">
        {format(new Date(booking.startTime), formatString, { locale: es })}
      </p>
      {isOwnerView && (
        <p className="text-xs text-muted-foreground">
          con: <span className="font-medium">{booking.barber.name}</span>
        </p>
      )}
    </li>
  );
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
    <div className="space-y-6">
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

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Próximos turnos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {turnosFuturos.length > 0 ? (
                <ul className="space-y-3">
                  {turnosFuturos.map((booking) => (
                    <BookingListItem
                      key={booking.id}
                      booking={booking as BookingWithDetails}
                      formatString="EEEE d 'de' MMMM, HH:mm 'hs'"
                      isOwnerView={currentUser.role === Role.OWNER}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay turnos futuros agendados.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historialDeTurnos.length > 0 ? (
                <ul className="space-y-3">
                  {historialDeTurnos.map((booking) => (
                    <BookingListItem
                      key={booking.id}
                      booking={booking as BookingWithDetails}
                      formatString="d/MM/yyyy - HH:mm 'hs'"
                      isOwnerView={currentUser.role === Role.OWNER}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay historial de turnos.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
