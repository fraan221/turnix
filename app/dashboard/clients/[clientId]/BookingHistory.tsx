"use client";

import { useState, useMemo } from "react";
import { formatLongDateTime, formatShortDateTime } from "@/lib/date-helpers";
import { Booking, BookingStatus, Service } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, History, CalendarX2, ChevronDown, ChevronUp } from "lucide-react";

type BookingWithDetails = Booking & {
  service: Service | null;
  barber: {
    name: string | null;
  };
};

interface BookingHistoryProps {
  turnosFuturos: BookingWithDetails[];
  historialDeTurnos: BookingWithDetails[];
}

function BookingListItem({
  booking,
  formattedDate,
  isLast,
}: {
  booking: BookingWithDetails;
  formattedDate: string;
  isLast?: boolean;
}) {
  const statusMap = {
    [BookingStatus.COMPLETED]: {
      text: "Completado",
      className: "bg-green-100 text-green-800 border-transparent",
    },
    [BookingStatus.CANCELLED]: {
      text: "Cancelado",
      className: "bg-red-100 text-red-800 border-transparent",
    },
    [BookingStatus.SCHEDULED]: {
      text: "Próximo",
      className: "bg-blue-100 text-blue-800 border-transparent",
    },
  };

  const status = statusMap[booking.status];

  return (
    <li className="relative pl-10 pb-6 last:pb-0">
      {/* Timeline vertical line */}
      {!isLast && (
        <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
      )}
      {/* Timeline dot */}
      <div className={cn(
        "absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background",
        booking.status === "COMPLETED" ? "border-green-500" :
        booking.status === "CANCELLED" ? "border-red-500" : "border-blue-500"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full",
          booking.status === "COMPLETED" ? "bg-green-500" :
          booking.status === "CANCELLED" ? "bg-red-500" : "bg-blue-500"
        )} />
      </div>

      <div className={cn("flex flex-col gap-1", booking.status === "CANCELLED" && "opacity-60")}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm leading-tight">
            {booking.service?.name ?? "Servicio eliminado"}
          </p>
          {status && <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", status.className)}>{status.text}</Badge>}
        </div>
        <p className="capitalize text-xs text-muted-foreground">{formattedDate}</p>
        <p className="text-xs text-muted-foreground mt-1">
          con: <span className="font-medium text-foreground">{booking.barber.name}</span>
        </p>
      </div>
    </li>
  );
}

export function BookingHistory({
  turnosFuturos,
  historialDeTurnos,
}: BookingHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const tieneMasTurnos = historialDeTurnos.length > 5;

  const turnosMostrados = useMemo(() => {
    return isExpanded ? historialDeTurnos : historialDeTurnos.slice(0, 5);
  }, [isExpanded, historialDeTurnos]);

  return (
    <div className="space-y-6 lg:col-span-1">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="w-5 h-5 text-primary" />
            Próximos turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {turnosFuturos.length > 0 ? (
            <ul className="relative">
              {turnosFuturos.map((booking, index) => (
                <BookingListItem
                  key={booking.id}
                  booking={booking}
                  formattedDate={formatLongDateTime(booking.startTime)}
                  isLast={index === turnosFuturos.length - 1}
                />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <CalendarX2 className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">No hay turnos próximos</p>
              <p className="text-xs opacity-70">Los próximos turnos agendados aparecerán aquí…</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-primary" />
            Historial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historialDeTurnos.length > 0 ? (
            <div className="space-y-4">
              <ul className="relative">
                {turnosMostrados.map((booking, index) => (
                  <BookingListItem
                    key={booking.id}
                    booking={booking}
                    formattedDate={formatShortDateTime(booking.startTime)}
                    isLast={index === turnosMostrados.length - 1}
                  />
                ))}
              </ul>
              
              {tieneMasTurnos && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Ver {historialDeTurnos.length - 5} turnos más
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <History className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">No hay historial</p>
              <p className="text-xs opacity-70">Aún no se han completado turnos.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
