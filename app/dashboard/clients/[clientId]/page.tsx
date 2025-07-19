import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { updateClientNotes } from "@/actions/dashboard.actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const updateNotesAction = updateClientNotes.bind(null, client.id);
  const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(
    client.phone
  )}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-1">
          <h1 className="text-3xl font-bold">
            Ficha de Cliente: {client.name}
          </h1>
          <p className="text-muted-foreground">{client.phone}</p>
        </div>
        <Link href={whatsappUrl} target="_blank">
          <Button>
            <MessageSquare className="w-4 h-4 mr-2" />
            Contactar por WhatsApp
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Notas Privadas</CardTitle>
              <CardDescription>
                Añade aquí cualquier detalle importante sobre este cliente. Solo
                tú podrás verlo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateNotesAction}>
                <div className="grid w-full gap-2">
                  <Label htmlFor="notes">Notas sobre {client.name}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Ej: Prefiere la máquina en el número 2, le gusta hablar de fútbol, alérgico a..."
                    defaultValue={client.notes || ""}
                    rows={6}
                  />
                  <Button type="submit" className="w-full mt-2">
                    Guardar Notas
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Próximos Turnos
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
                Historial de Servicios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historialDeTurnos.length > 0 ? (
                <ul className="space-y-3">
                  {historialDeTurnos.map((booking) => (
                    <li key={booking.id} className="text-sm">
                      <p className="font-semibold">{booking.service.name}</p>
                      <p className="capitalize text-muted-foreground">
                        {format(
                          new Date(booking.startTime),
                          "d 'de' MMMM yyyy, HH:mm 'hs'",
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
