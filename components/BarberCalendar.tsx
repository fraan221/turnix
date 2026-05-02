"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
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
import { BulkConfirmFAB } from "./bulk-confirm/BulkConfirmFAB";
import { DayUnconfirmedBadge } from "./bulk-confirm/DayUnconfirmedBadge";
import {
  useBulkSelectionStore,
  selectIsSelectionMode,
  selectSelectedDate,
  selectSelectedBookingIds,
  selectSelectedCount,
} from "@/lib/stores/bulk-selection-store";

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
      <div className="text-sm text-muted-foreground">
        <Skeleton className="w-56 h-4" />
      </div>
    </DialogHeader>
    <div className="py-4 space-y-4">
      <div className="space-y-2 text-sm">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-10/12 h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-11/12 h-4" />
        <Skeleton className="w-full h-4" />
      </div>
      <div className="flex justify-between gap-2 pt-4">
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

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function SubmitButton({ isDisabled }: { isDisabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending || isDisabled}>
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
  const hasSubmittedRef = useRef(false);
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<CalendarView>(
    (searchParams.get("view") as CalendarView) ||
      (isMobile ? "timeGridDay" : "timeGridWeek"),
  );
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [calendarTitle, setCalendarTitle] = useState("");
  const [optimisticBookings, setOptimisticBookings] = useState(bookings);

  // Bulk selection store
  const isSelectionMode = useBulkSelectionStore(selectIsSelectionMode);
  const selectedDate = useBulkSelectionStore(selectSelectedDate);
  const selectedBookingIds = useBulkSelectionStore(selectSelectedBookingIds);
  const selectedCount = useBulkSelectionStore(selectSelectedCount);
  const toggleBooking = useBulkSelectionStore((s) => s.toggleBooking);

  // Compute unconfirmed bookings (SCHEDULED and past)
  const unconfirmedByDate = useMemo(() => {
    const now = new Date();
    const byDate = new Map<string, string[]>();

    const unconfirmed = optimisticBookings.filter(
      (b) =>
        b.status === BookingStatus.SCHEDULED &&
        new Date(b.startTime) < now,
    );

    for (const booking of unconfirmed) {
      const dateKey = getDateKey(new Date(booking.startTime));
      const existing = byDate.get(dateKey) ?? [];
      existing.push(booking.id);
      byDate.set(dateKey, existing);
    }

    return byDate;
  }, [optimisticBookings]);

  const selectedDateUnconfirmedIds = useMemo(() => {
    if (!selectedDate) return [];
    return unconfirmedByDate.get(selectedDate) ?? [];
  }, [selectedDate, unconfirmedByDate]);

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

    const handleRealtimeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.bookingId && customEvent.detail?.status) {
        handleOptimisticUpdate(
          customEvent.detail.bookingId,
          customEvent.detail.status,
        );
        router.refresh();
      }
    };

    window.addEventListener("new-booking-event", handleNewBooking);
    window.addEventListener("booking-realtime-update", handleRealtimeUpdate);

    return () => {
      window.removeEventListener("new-booking-event", handleNewBooking);
      window.removeEventListener(
        "booking-realtime-update",
        handleRealtimeUpdate,
      );
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

      router.refresh();
    }

    if (state?.success) {
      hasSubmittedRef.current = true;
      toast.success("¡Éxito!", { description: state.success });
      setCreateModalOpen(false);
      formRef.current?.reset();
    }
  }, [state, router]);

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
      const totalDuration =
        booking.durationAtBooking ?? booking.service?.durationInMinutes ?? 60;
      const activeDuration =
        booking.activeDurationAtBooking ??
        booking.service?.activeDurationInMinutes ??
        totalDuration;
      const allowsOverlapping = activeDuration < totalDuration;
      const endTime = new Date(
        booking.startTime.getTime() + totalDuration * 60000,
      );

      const isPastScheduled =
        booking.status === BookingStatus.SCHEDULED &&
        new Date(booking.startTime) < new Date();
      const bookingDateKey = getDateKey(new Date(booking.startTime));
      const isSelectableInSelectionMode =
        isPastScheduled &&
        (selectedDate ? bookingDateKey === selectedDate : true);
      const isSelected = selectedBookingIds.has(booking.id);

      let eventColor = "#3b82f6";
      let eventClassName = "cursor-pointer";

      if ((booking as any).recurringBookingId) {
        eventColor = "#8b5cf6";
      } else if (booking.paymentStatus === "PENDING") {
        eventColor = "#f59e0b";
      } else if (booking.status === "COMPLETED") {
        eventColor = "#22c55e";
      }

      // In selection mode, highlight selected events
      if (isSelectionMode && isPastScheduled) {
        if (isSelectableInSelectionMode && isSelected) {
          eventColor = "#0ea5e9";
          eventClassName = "cursor-pointer ring-2 ring-sky-400 ring-offset-1";
        } else if (!isSelectableInSelectionMode) {
          eventClassName = "cursor-not-allowed opacity-50";
        } else {
          eventClassName = "cursor-pointer opacity-70";
        }
      }

      return {
        id: booking.id,
        title: `${booking.service?.name ?? "Servicio"} - ${booking.client.name}${
          allowsOverlapping ? " [S]" : ""
        }${(booking as any).recurringBookingId ? " [F]" : ""}`,
        start: booking.startTime,
        end: endTime,
        backgroundColor: eventColor,
        borderColor: eventColor,
        className: eventClassName + ((booking as any).recurringBookingId ? " border-2 border-dashed opacity-90" : ""),
        extendedProps: {
          ...booking,
          isPastScheduled,
          isSelected,
          bookingDateKey,
          isSelectableInSelectionMode,
          allowsOverlapping,
        },
      };
    });

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (isSelectionMode) {
      return;
    }

    setSelectedDateInfo(selectInfo);
    hasSubmittedRef.current = false;
    setCreateModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const bookingData = clickInfo.event.extendedProps as BookingWithDetails & {
      isPastScheduled?: boolean;
      isSelectableInSelectionMode?: boolean;
    };

    // In selection mode, toggle selection for past scheduled bookings
    if (isSelectionMode) {
      if (!bookingData.isPastScheduled) {
        toast.info("Solo podés seleccionar turnos pasados sin confirmar.");
        return;
      }

      if (!bookingData.isSelectableInSelectionMode) {
        toast.info("Solo podés seleccionar turnos del día elegido.");
        return;
      }

      toggleBooking(bookingData.id);
      return;
    }

    // Normal mode: open booking details
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
          <div className="flex flex-col items-center justify-center h-full">
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
          const dateKey = getDateKey(arg.date);
          const unconfirmedCount = unconfirmedByDate.get(dateKey)?.length ?? 0;

          return (
            <div className="flex items-center justify-center gap-2">
              <span className="text-base font-normal">
                {arg.date.toLocaleDateString("es-AR", { weekday: "long" })}
              </span>
              {!isSelectionMode && unconfirmedCount > 0 && (
                <DayUnconfirmedBadge date={dateKey} count={unconfirmedCount} />
              )}
            </div>
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
    eventContent: (arg: any) => {
      const isPastScheduled = arg.event.extendedProps?.isPastScheduled;
      const isSelected = arg.event.extendedProps?.isSelected;
      const isSelectableInSelectionMode =
        arg.event.extendedProps?.isSelectableInSelectionMode;

      if (!isSelectionMode || !isPastScheduled || !isSelectableInSelectionMode) {
        return {
          html: `<div class=\"fc-event-main-frame\"><div class=\"fc-event-title-container\"><div class=\"fc-event-title\">${arg.event.title}</div></div></div>`,
        };
      }

      const marker = isSelected ? "[x]" : "[ ]";

      return {
        html: `<div class=\"fc-event-main-frame\"><div class=\"fc-event-title-container\"><div class=\"fc-event-title\">${marker} ${arg.event.title}</div></div></div>`,
      };
    },
  } as const;

  return (
    <>
      <div
        className="mx-auto bg-white max-w-7xl"
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

        {isSelectionMode && (
          <div className="p-3 mb-4 text-sm rounded-lg border bg-sky-50 border-sky-200 text-sky-900">
            <p className="font-semibold">
              {selectedDate
                ? `Modo selección activo para ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-AR")}`
                : "Modo selección activo"}
              : {selectedCount} turno{selectedCount === 1 ? "" : "s"} seleccionado{selectedCount === 1 ? "" : "s"}.
            </p>
            <p className="mt-1 text-xs">
              Tocá los turnos pasados sin confirmar de ese día para sumarlos o quitarlos.
            </p>
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          initialView={view}
          initialDate={searchParams.get("date") || new Date().toISOString()}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          {...calendarOptions}
          timeZone="local"
          datesSet={handleDatesSet}
          events={events}
          editable={!isSelectionMode}
          selectable={!isSelectionMode}
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
          slotDuration="00:15:00"
          snapDuration="00:05:00"
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
        <DialogContent className="sm:max-w-[640px]">
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
            <SubmitButton isDisabled={hasSubmittedRef.current} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Confirmation FAB */}
      <BulkConfirmFAB
        dayUnconfirmedIds={selectedDateUnconfirmedIds}
      />
    </>
  );
}
