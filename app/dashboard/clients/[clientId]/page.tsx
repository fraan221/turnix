import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ClientNotesForm } from "./ClientNotesForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, History, MessageSquare } from "lucide-react";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils";

interface ClientDetailPageProps {
  params: { clientId: string };
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: {
      bookings: {
        where: {
          barberId: session.user.id,
        },
        include: {
          service: true,
        },
        orderBy: {
          startTime: "desc",
        },
      },
    },
  });

  if (!client) {
    return <p>Cliente no encontrado.</p>;
  }

  const now = new Date();
  const turnosFuturos = client.bookings
    .filter((booking) => new Date(booking.startTime) > now)
    .reverse();
  const historialDeTurnos = client.bookings.filter(
    (booking) => new Date(booking.startTime) <= now
  );

  const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(
    client.phone
  )}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight font-heading md:text-3xl">
            Ficha de Cliente: {client.name}
          </h1>
        </div>
        <Link href={whatsappUrl} target="_blank">
          <Button>
            <MessageSquare className="w-4 h-4 mr-2" />
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
                    <li key={booking.id} className="text-sm">
                      <p className="font-semibold">{booking.service.name}</p>
                      <p className="capitalize text-muted-foreground">
                        {format(
                          new Date(booking.startTime),
                          "EEEE d 'de' MMMM, HH:mm 'hs'",
                          { locale: es }
                        )}
                      </p>
                    </li>
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
                    <li key={booking.id} className="text-sm">
                      <p className="font-semibold">{booking.service.name}</p>
                      <p className="text-muted-foreground">
                        {format(
                          new Date(booking.startTime),
                          "d/MM/yyyy - HH:mm 'hs'",
                          { locale: es }
                        )}
                      </p>
                    </li>
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
