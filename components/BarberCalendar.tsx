"use client";

import { useEffect, useState, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { CalendarViewSwitcher } from "./CalendarViewSwitcher";
import { Booking, Service, Client, BookingStatus } from "@prisma/client";
import { useWindowSize } from "@/lib/hooks";
import BookingDetailsDialog from "./BookingDetailsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { createBooking, type FormState } from "@/actions/dashboard.actions";
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
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const initialState: FormState = {
  error: null,
  success: null,
};

type BookingWithDetails = Booking & {
  service: Service;
  client: Client;
};

type CalendarView = "timeGridDay" | "timeGridWeek" | "dayGridMonth";

interface BarberCalendarProps {
  bookings: BookingWithDetails[];
  services: Service[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Agendando...
        </>
      ) : (
        "Agendar turno"
      )}
    </Button>
  );
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

  const [state, formAction] = useFormState(createBooking, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<CalendarView>(isMobile ? 'timeGridDay' : 'timeGridWeek');
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  const [calendarTitle, setCalendarTitle] = useState("");

  useEffect(() => {
    calendarRef.current?.getApi().changeView(view);
  }, [view]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || touchStartX === null) return;
    const currentX = e.targetTouches[0].clientX;
    const deltaX = currentX - touchStartX;
    const calendarApi = calendarRef.current?.getApi();

    if (Math.abs(deltaX) > 80) {
      if (deltaX > 0) {
        calendarApi?.prev();
      } else {
        calendarApi?.next();
      }
      setTouchStartX(null);
    }
  };

  useEffect(() => {
    const handleNewBooking = () => {
      router.refresh();
    };
    window.addEventListener("new-booking-event", handleNewBooking);
    return () => {
      window.removeEventListener("new-booking-event", handleNewBooking);
    };
  }, [router]);

  useEffect(() => {
    if (state?.error) {
      let errorMessage = "Ocurrió un error inesperado.";

      if (typeof state.error === "string") {
        errorMessage = state.error;
      } else if (typeof state.error === "object" && state.error !== null) {
        const firstError = Object.values(state.error).flat()[0];
        if (typeof firstError === "string") {
          errorMessage = firstError;
        }
      }

      toast.error("Error al agendar", { description: errorMessage });
    }

    if (state?.success) {
      toast.success("¡Éxito!", { description: state.success });
      setCreateModalOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();
  const handleToday = () => calendarRef.current?.getApi().today();

  const handleDatesSet = (dateInfo: any) => {
      setCalendarTitle(dateInfo.view.title);
  };

  const events = bookings
    .filter((booking) => booking.status !== "CANCELLED")
    .map((booking) => {
      const endTime = new Date(
        booking.startTime.getTime() +
          (booking.service.durationInMinutes || 0) * 60000
      );

      let eventColor = "#3b82f6";
      let eventClassName = "cursor-pointer";

      if (booking.status === "COMPLETED") {
        eventColor = "#22c55e";
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

  const handleEventClick = (clickInfo: EventClickArg) => {
    const bookingData = clickInfo.event.extendedProps as BookingWithDetails;
    setSelectedBooking(bookingData);
    setDetailsModalOpen(true);
  };

  const calendarOptions = {
    headerToolbar: false,
    views: {
      dayGridMonth: {
        titleFormat: { month: 'long' },
        dayCellContent: (arg: any) => (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-xs text-muted-foreground">{arg.date.toLocaleDateString('es-AR', { weekday: 'narrow' })}</span>
            <span>{arg.dayNumberText.replace(' de', '')}</span>
          </div>
        ),
      },
      timeGridWeek: {
        titleFormat: { month: 'short', day: 'numeric' },
        dayHeaderFormat: { weekday: 'narrow', day: 'numeric', omitCommas: true },
        dayHeaderContent: (arg: any) => (
          // Vista SEMANA: Mantiene la estructura compleja de DIV + FLEX
          <div className="flex flex-col items-center">
            <span className="text-xs">{arg.date.toLocaleDateString('es-AR', { weekday: 'narrow' })}</span>
            <span className="text-lg">{arg.date.getDate()}</span>
          </div>
        )
      },
      timeGridDay: {
        titleFormat: { month: 'long' },
        dayHeaderFormat: { weekday: 'long' },
        dayHeaderContent: (arg: any) => {
          return (
            <span className="text-base font-normal">
              {arg.date.toLocaleDateString('es-AR', { weekday: 'long' })}
            </span>
          )
        }
      },
    },
    buttonText: {
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día",
    },
    slotLabelContent: (arg: any) => `${arg.text} hs`,
  } as const;

  return (
    <>
      <div 
        className="bg-white "
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {!isMobile && (
              <>
                <Button variant="secondary" size="icon" onClick={handlePrev}>
                  <ChevronLeft />
                </Button>
                <Button variant="secondary" size="icon" onClick={handleNext}>
                  <ChevronRight />
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleToday}>
              Hoy
            </Button>
          </div>

          <h1 className="text-xl font-bold text-center capitalize font-heading">
            {calendarTitle}
          </h1>

          <div className="flex justify-end">
            <CalendarViewSwitcher currentView={view} onViewChange={setView} />
          </div>
        </div>
        
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          {...calendarOptions}
          datesSet={handleDatesSet}
          events={events}
          editable={true}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          allDaySlot={false}
          locale="es"
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          nowIndicator={true}
          navLinks={true}
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
          <form ref={formRef} action={formAction} className="space-y-4">
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
            <SubmitButton />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
