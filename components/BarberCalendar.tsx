"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Booking, Service, Client, BookingStatus } from "@prisma/client";
import { useWindowSize } from "@/lib/hooks";
import BookingDetailsDialog from "./BookingDetailsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { createBooking } from "@/actions/dashboard.actions";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type BookingWithDetails = Booking & {
  service: Service;
  client: Client;
};

interface BarberCalendarProps {
  bookings: BookingWithDetails[];
  services: Service[];
}

export default function BarberCalendar({
  bookings,
  services,
}: BarberCalendarProps) {
  const router = useRouter();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] =
    useState<DateSelectArg | null>(null);

  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithDetails | null>(null);

  useEffect(() => {
    const handleNewBooking = () => {
      router.refresh();
    };
    window.addEventListener("new-booking-event", handleNewBooking);
    return () => {
      window.removeEventListener("new-booking-event", handleNewBooking);
    };
  }, [router]);

  const events = bookings.map((booking) => {
    const endTime = new Date(
      booking.startTime.getTime() +
        (booking.service.durationInMinutes || 0) * 60000
    );

    let eventColor = "#3b82f6";
    let eventClassName = "cursor-pointer";

    if (booking.status === "COMPLETED") {
      eventColor = "#22c55e";
    } else if (booking.status === "CANCELLED") {
      eventColor = "#ef4444";
      eventClassName += " opacity-60 line-through";
    }

    return {
      id: booking.id,
      title: `${booking.service.name} - ${booking.client.name}`,
      start: booking.startTime,
      end: endTime,
      backgroundColor: eventColor,
      borderColor: eventColor,
      className: eventClassName,
      extendedProps: booking,
    };
  });

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDateInfo(selectInfo);
    setCreateModalOpen(true);
  };

  // --- FUNCIÓN CORREGIDA PARA MANEJAR EL CLIC ---
  const handleEventClick = (clickInfo: EventClickArg) => {
    const bookingData = clickInfo.event.extendedProps as BookingWithDetails;
    setSelectedBooking(bookingData);
    setDetailsModalOpen(true);
  };

  const initialView = isMobile ? "timeGridDay" : "timeGridWeek";

  return (
    <>
      <div className="p-2 bg-white border rounded-lg border-black/15 md:p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick} // <-- Se pasa la referencia a la función
          allDaySlot={false}
          locale="es"
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          nowIndicator={true}
          titleFormat={{ year: "numeric", month: "long" }}
          dayHeaderFormat={{ weekday: "short", day: "numeric" }}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          slotLabelContent={(arg) => `${arg.text} hs`}
        />
      </div>

      <BookingDetailsDialog
        booking={selectedBooking}
        isOpen={isDetailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />

      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Turno</DialogTitle>
          </DialogHeader>
          <form
            action={async (formData) => {
              await createBooking(formData);
              setCreateModalOpen(false);
            }}
            className="space-y-4"
          >
            <input
              type="hidden"
              name="startTime"
              value={selectedDateInfo?.startStr || ""}
            />
            <div>
              <Label htmlFor="clientName">Nombre del Cliente</Label>
              <Input id="clientName" name="clientName" required />
            </div>
            <div>
              <Label htmlFor="clientPhone">Teléfono del Cliente</Label>
              <Input id="clientPhone" name="clientPhone" required />
            </div>
            <div>
              <Label htmlFor="serviceId">Servicio</Label>
              <Select name="serviceId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} (${service.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Agendar Turno
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
