"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  Suspense,
  lazy,
} from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
} from "@fullcalendar/core";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { CalendarViewSwitcher } from "./CalendarViewSwitcher";
import { Booking, Service, Client, BookingStatus } from "@prisma/client";
import { useWindowSize } from "@/lib/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  createBooking,
  updateBookingTime,
  type FormState,
} from "@/actions/dashboard.actions";
import { formatTime } from "@/lib/date-helpers";
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
import { Skeleton } from "./ui/skeleton";
import { BookingWithDetails } from "./BookingDetailsDialog";
import { BarberSelector } from "./BarberSelector";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { useSession } from "next-auth/react";

const BookingDetailsDialogContent = lazy(() =>
  import("./BookingDetailsDialog").then((mod) => ({
    default: mod.BookingDetailsDialogContent,
  })),
);

const BookingDetailsSkeleton = () => (
  <>
    <DialogHeader>
      <DialogTitle>
        <Skeleton className="w-40 h-6" />
      </DialogTitle>
      <DialogDescription>
        <Skeleton className="w-56 h-4" />
      </DialogDescription>
    </DialogHeader>
    <div className="py-4 space-y-4">
      <div className="space-y-2 text-sm">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-10/12 h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-11/12 h-4" />
        <Skeleton className="w-full h-4" />
      </div>
      <div className="flex gap-2 justify-between pt-4">
        <Skeleton className="w-32 h-10" />
        <Skeleton className="w-48 h-10" />
      </div>
    </div>
  </>
);

const initialState: FormState = {
  error: null,
  success: null,
};

type CalendarView = "timeGridDay" | "timeGridWeek" | "dayGridMonth";

interface BarberCalendarProps {
  bookings: BookingWithDetails[];
  services: Service[];
  teamMembers?: { id: string; name: string }[];
  selectedBarberId?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
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
  teamMembers = [],
  selectedBarberId = "",
}: BarberCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] =
    useState<DateSelectArg | null>(null);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithDetails | null>(null);
  const [state, formAction] = useFormState(createBooking, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<CalendarView>(
    (searchParams.get("view") as CalendarView) ||
      (isMobile ? "timeGridDay" : "timeGridWeek"),
  );
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [calendarTitle, setCalendarTitle] = useState("");
  const [optimisticBookings, setOptimisticBookings] = useState(bookings);

  const targetBarberId = selectedBarberId || session?.user?.id || "";
  useRealtimeSubscription<Booking>({
    userId: targetBarberId,
    table: "Booking",
    enabled: !!targetBarberId,
    onInsert: () => router.refresh(),
    onUpdate: () => router.refresh(),
    onDelete: () => router.refresh(),
  });

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

  const handleNavigate = useCallback(
    (date: Date, newView: CalendarView) => {
      const formattedDate = date.toISOString().split("T")[0];
      const params = new URLSearchParams(searchParams);
      params.set("date", formattedDate);
      params.set("view", newView);

      router.replace(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const [draggedEventInfo, setDraggedEventInfo] = useState<{
    bookingId: string;
    newStartTime: Date;
    oldStartTime: Date;
    revert: () => void;
  } | null>(null);

  const handleEventDrop = (dropInfo: EventDropArg) => {
    const { event, oldEvent, revert } = dropInfo;

    if (!event.start) {
      revert();
      return;
    }

    setDraggedEventInfo({
      bookingId: event.id,
      newStartTime: event.start,
      oldStartTime: oldEvent.start!,
      revert,
    });
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

  useEffect(() => {
    setOptimisticBookings(bookings);
  }, [bookings]);

  const handleOptimisticUpdate = (
    bookingId: string,
    newStatus: BookingStatus,
  ) => {
    setOptimisticBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking,
      ),
    );
  };

  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();
  const handleToday = () => calendarRef.current?.getApi().today();

  const handleDatesSet = (dateInfo: any) => {
    const newView = dateInfo.view.type as CalendarView;
    const newDate = dateInfo.view.currentStart;

    if (view !== newView) {
      setView(newView);
    }
    setCalendarTitle(dateInfo.view.title);
    handleNavigate(newDate, newView);
  };

  const events = optimisticBookings
    .filter((booking) => booking.status !== "CANCELLED")
    .map((booking) => {
      const endTime = new Date(
        booking.startTime.getTime() +
          (booking.service?.durationInMinutes || 0) * 60000,
      );

      let eventColor = "#3b82f6";
      let eventClassName = "cursor-pointer";

      if (booking.status === "COMPLETED") {
        eventColor = "#22c55e";
      }

      return {
        id: booking.id,
        title: `${booking.service?.name ?? "Servicio"} - ${booking.client.name}`,
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
  };

  const calendarOptions = {
    headerToolbar: false,
    slotLabelFormat: {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    views: {
      dayGridMonth: {
        titleFormat: { month: "long" },
        dayCellContent: (arg: any) => (
          <div className="flex flex-col justify-center items-center h-full">
            <span className="text-xs text-muted-foreground">
              {arg.date.toLocaleDateString("es-AR", { weekday: "narrow" })}
            </span>
            <span>{arg.dayNumberText.replace(" de", "")}</span>
          </div>
        ),
      },
      timeGridWeek: {
        titleFormat: { month: "short", day: "numeric" },
        dayHeaderFormat: {
          weekday: "narrow",
          day: "numeric",
          omitCommas: true,
        },
        dayHeaderContent: (arg: any) => (
          <div className="flex flex-col items-center">
            <span className="text-xs">
              {arg.date.toLocaleDateString("es-AR", { weekday: "narrow" })}
            </span>
            <span className="text-lg">{arg.date.getDate()}</span>
          </div>
        ),
      },
      timeGridDay: {
        titleFormat: { month: "long" },
        dayHeaderFormat: { weekday: "long" },
        dayHeaderContent: (arg: any) => {
          return (
            <span className="text-base font-normal">
              {arg.date.toLocaleDateString("es-AR", { weekday: "long" })}
            </span>
          );
        },
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
        className="mx-auto max-w-7xl bg-white"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 items-center">
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
            {teamMembers.length > 1 && (
              <BarberSelector
                teamMembers={teamMembers}
                selectedBarberId={selectedBarberId}
                compact
              />
            )}
          </div>

          <h1 className="text-xl font-bold text-center capitalize font-heading">
            {calendarTitle}
          </h1>

          <div className="flex justify-end">
            <CalendarViewSwitcher
              currentView={view}
              onViewChange={(newView) => {
                calendarRef.current?.getApi().changeView(newView);
              }}
            />
          </div>
        </div>

        <FullCalendar
          ref={calendarRef}
          initialView={view}
          initialDate={searchParams.get("date") || new Date().toISOString()}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          {...calendarOptions}
          timeZone="local"
          datesSet={handleDatesSet}
          events={events}
          editable={true}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          navLinkDayClick={(date) => {
            const calendarApi = calendarRef.current?.getApi();
            if (calendarApi) {
              calendarApi.changeView("timeGridDay", date);
              setView("timeGridDay");
            }
          }}
          allDaySlot={false}
          locale="es"
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          nowIndicator={true}
          navLinks={true}
        />
      </div>

      <Dialog
        open={!!selectedBooking}
        onOpenChange={(isOpen) => !isOpen && setSelectedBooking(null)}
      >
        <DialogContent>
          {selectedBooking && (
            <Suspense fallback={<BookingDetailsSkeleton />}>
              <BookingDetailsDialogContent
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onOptimisticUpdate={handleOptimisticUpdate}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!draggedEventInfo}
        onOpenChange={(isOpen) => !isOpen && setDraggedEventInfo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de horario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés mover este turno a las{" "}
              <span className="font-bold text-foreground">
                {draggedEventInfo && formatTime(draggedEventInfo.newStartTime)}
                hs
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                draggedEventInfo?.revert();
                setDraggedEventInfo(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!draggedEventInfo) return;

                const { bookingId, newStartTime, oldStartTime } =
                  draggedEventInfo;

                setOptimisticBookings((current) =>
                  current.map((b) =>
                    b.id === bookingId ? { ...b, startTime: newStartTime } : b,
                  ),
                );

                setDraggedEventInfo(null);

                const result = await updateBookingTime(bookingId, newStartTime);

                if (result.error) {
                  toast.error("Error al mover el turno", {
                    description: result.error,
                  });
                  setOptimisticBookings((current) =>
                    current.map((b) =>
                      b.id === bookingId
                        ? { ...b, startTime: oldStartTime }
                        : b,
                    ),
                  );
                } else {
                  toast.success("Turno reprogramado con éxito.");
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Turno</DialogTitle>
          </DialogHeader>
          <form ref={formRef} action={formAction} className="space-y-4">
            <input
              type="hidden"
              name="startTime"
              value={selectedDateInfo?.start.toISOString() || ""}
            />
            <input
              type="hidden"
              name="targetBarberId"
              value={selectedBarberId || ""}
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
