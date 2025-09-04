"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Booking, BookingStatus, Role, Service } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, History } from "lucide-react";

type BookingWithDetails = Booking & {
  service: Service;
  barber: {
    name: string | null;
  };
};

interface BookingHistoryProps {
  turnosFuturos: BookingWithDetails[];
  historialDeTurnos: BookingWithDetails[];
  isOwnerView: boolean;
}

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

export function BookingHistory({
  turnosFuturos,
  historialDeTurnos,
  isOwnerView,
}: BookingHistoryProps) {
  return (
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
                  booking={booking}
                  formatString="EEEE d 'de' MMMM, HH:mm 'hs'"
                  isOwnerView={isOwnerView}
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
                  booking={booking}
                  formatString="d/MM/yyyy - HH:mm 'hs'"
                  isOwnerView={isOwnerView}
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
  );
}
