"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import {
  Booking,
  Client,
  Service,
  BookingStatus,
  PaymentMethod,
} from "@prisma/client";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  deleteClient,
  updateBookingTime,
  updateBookingStatus,
  updateClientNotes,
  checkBookingAvailability,
  setPaymentMethod,
} from "@/actions/dashboard.actions";
import { formatLongDate, formatTime } from "@/lib/date-helpers";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Banknote,
  Smartphone,
  CreditCard,
  Lightbulb,
  Clock,
  Check,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export type BookingWithDetails = Omit<Booking, "depositAmount"> & {
  depositAmount: number | string | null;
  service: Service | null;
  client: Client;
};

interface BookingDetailsDialogContentProps {
  booking: BookingWithDetails;
  onClose: () => void;
  onOptimisticUpdate: (bookingId: string, newStatus: BookingStatus) => void;
}

type DialogView =
  | "details"
  | "addNote"
  | "confirmDeleteClient"
  | "editTime"
  | "selectPayment";

const statusMap = {
  [BookingStatus.SCHEDULED]: { text: "Agendado", color: "text-blue-600" },
  [BookingStatus.COMPLETED]: { text: "Completado", color: "text-green-600" },
  [BookingStatus.CANCELLED]: { text: "Cancelado", color: "text-red-600" },
};

const PAYMENT_METHODS = [
  {
    value: "CASH" as PaymentMethod,
    label: "Efectivo",
    shortLabel: "Efectivo",
    icon: Banknote,
    bgClass:
      "bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-900/50",
    textClass: "text-green-700 dark:text-green-300",
    borderClass: "border-green-200 dark:border-green-800",
    ringClass: "ring-green-500",
  },
  {
    value: "TRANSFER" as PaymentMethod,
    label: "Transferencia / MP",
    shortLabel: "Transf.",
    icon: Smartphone,
    bgClass:
      "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/50",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-200 dark:border-blue-800",
    ringClass: "ring-blue-500",
  },
  {
    value: "CARD" as PaymentMethod,
    label: "Tarjeta",
    shortLabel: "Tarjeta",
    icon: CreditCard,
    bgClass:
      "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/50",
    textClass: "text-purple-700 dark:text-purple-300",
    borderClass: "border-purple-200 dark:border-purple-800",
    ringClass: "ring-purple-500",
  },
] as const;

function getPaymentMethodConfig(method: PaymentMethod) {
  return PAYMENT_METHODS.find((m) => m.value === method) ?? PAYMENT_METHODS[0];
}

interface PaymentMethodPickerProps {
  onSelect: (method: PaymentMethod) => void;
  isLoading: boolean;
  selectedMethod: PaymentMethod | null;
  compact?: boolean;
}

function PaymentMethodPicker({
  onSelect,
  isLoading,
  selectedMethod,
  compact = false,
}: PaymentMethodPickerProps) {
  return (
    <div
      className={compact ? "grid grid-cols-3 gap-2" : "grid grid-cols-1 gap-3"}
    >
      {PAYMENT_METHODS.map((method) => {
        const Icon = method.icon;
        const isSelected = isLoading && selectedMethod === method.value;

        return (
          <Button
            key={method.value}
            variant="outline"
            className={cn(
              compact
                ? "h-12 flex-col gap-1 px-2"
                : "h-16 justify-start px-6 text-lg",
              method.bgClass,
              method.textClass,
              method.borderClass,
              isSelected && `ring-2 ${method.ringClass}`,
            )}
            onClick={() => onSelect(method.value)}
            disabled={isLoading}
          >
            {isSelected ? (
              <Loader2
                className={cn(
                  compact ? "w-5 h-5" : "mr-4 w-6 h-6",
                  "animate-spin",
                )}
              />
            ) : (
              <Icon className={cn(compact ? "w-5 h-5" : "mr-4 w-6 h-6")} />
            )}
            {compact ? (
              <span className="text-xs font-medium leading-none">
                {method.shortLabel}
              </span>
            ) : (
              method.label
            )}
          </Button>
        );
      })}
    </div>
  );
}

export function BookingDetailsDialogContent({
  booking,
  onClose,
  onOptimisticUpdate,
}: BookingDetailsDialogContentProps) {
  const [isCompleting, startCompleting] = useTransition();
  const [isCancelling, startCancelling] = useTransition();
  const [isNoteSaving, startNoteSaving] = useTransition();
  const [isClientDeleting, startClientDeleting] = useTransition();
  const [isTimeUpdating, startTimeUpdating] = useTransition();

  const [view, setView] = useState<DialogView>("details");
  const [note, setNote] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    null,
  );
  const [optimisticPaymentSet, setOptimisticPaymentSet] = useState(false);

  const [editingStartTime, setEditingStartTime] = useState("");
  const [editingEndTime, setEditingEndTime] = useState("");
  const [availability, setAvailability] = useState<{
    status: "idle" | "checking" | "available" | "unavailable";
    reason?: string;
  }>({ status: "idle" });

  const originalDuration =
    booking.durationAtBooking ?? booking.service?.durationInMinutes ?? 60;

  useEffect(() => {
    setView("details");
    setNote(booking.client.notes || "");

    const start = new Date(booking.startTime);
    const duration =
      booking.durationAtBooking ?? booking.service?.durationInMinutes ?? 60;
    const end = new Date(start.getTime() + duration * 60000);

    setEditingStartTime(
      start.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    );
    setEditingEndTime(
      end.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    );
  }, [
    booking.id,
    booking.client.notes,
    booking.startTime,
    booking.durationAtBooking,
    booking.service?.durationInMinutes,
  ]);

  const calculatedDuration = useMemo(() => {
    if (!editingStartTime || !editingEndTime) return 0;
    const [startH, startM] = editingStartTime.split(":").map(Number);
    const [endH, endM] = editingEndTime.split(":").map(Number);
    return endH * 60 + endM - (startH * 60 + startM);
  }, [editingStartTime, editingEndTime]);

  const debouncedStart = useDebounce(editingStartTime, 500);
  const debouncedEnd = useDebounce(editingEndTime, 500);

  useEffect(() => {
    if (!debouncedStart || !debouncedEnd) return;

    if (calculatedDuration <= 0) {
      setAvailability({
        status: "unavailable",
        reason: "La hora de fin debe ser posterior a la de inicio.",
      });
      return;
    }
    if (calculatedDuration < 5) {
      setAvailability({
        status: "unavailable",
        reason: "La duración mínima es de 5 minutos.",
      });
      return;
    }
    if (calculatedDuration > 480) {
      setAvailability({
        status: "unavailable",
        reason: "La duración máxima es de 8 horas.",
      });
      return;
    }

    const checkAvailability = async () => {
      setAvailability((prev) => ({ ...prev, status: "checking" }));

      const [hours, minutes] = debouncedStart.split(":").map(Number);
      const newStartTime = new Date(booking.startTime);
      newStartTime.setHours(hours, minutes, 0, 0);

      try {
        const result = await checkBookingAvailability(
          booking.barberId,
          newStartTime,
          calculatedDuration,
          calculatedDuration,
          booking.id,
        );

        setAvailability(
          result.available
            ? { status: "available" }
            : { status: "unavailable", reason: result.reason },
        );
      } catch (error) {
        setAvailability({
          status: "unavailable",
          reason: "Error al verificar disponibilidad.",
        });
      }
    };

    checkAvailability();
  }, [
    debouncedStart,
    debouncedEnd,
    calculatedDuration,
    booking.barberId,
    booking.id,
    booking.startTime,
  ]);

  const handleTimeChange = () => {
    if (!editingStartTime || !editingEndTime) {
      toast.error("Error", {
        description: "Seleccioná horas válidas.",
      });
      return;
    }

    if (availability.status === "unavailable") {
      toast.error("Error", {
        description: availability.reason || "El horario no está disponible.",
      });
      return;
    }

    const [hours, minutes] = editingStartTime.split(":").map(Number);
    const newStartTime = new Date(booking.startTime);
    newStartTime.setHours(hours, minutes, 0, 0);

    startTimeUpdating(async () => {
      const result = await updateBookingTime(
        booking.id,
        newStartTime,
        calculatedDuration,
      );

      if (result?.error) {
        toast.error("Error al cambiar horario", {
          description: result.error,
        });
        return;
      }

      toast.success("Horario actualizado", {
        description: result.success || "Turno reprogramado con éxito.",
      });
      onClose();
    });
  };

  const handleStatusChange = (
    newStatus: BookingStatus,
    paymentMethod?: PaymentMethod,
  ) => {
    onOptimisticUpdate(booking.id, newStatus);
    const transition =
      newStatus === "COMPLETED" ? startCompleting : startCancelling;
    transition(async () => {
      const result = await updateBookingStatus(
        booking.id,
        newStatus,
        paymentMethod,
      );
      if (result?.success) {
        toast.success("¡Éxito!", { description: result.success });
        if (newStatus === "COMPLETED") {
          setView("addNote");
        } else if (newStatus === "CANCELLED") {
          setView("confirmDeleteClient");
        }
      }
      if (result?.error) {
        toast.error("Error", { description: result.error });
      }
    });
  };

  const handleAddNote = () => {
    startNoteSaving(async () => {
      const formData = new FormData();
      const existingNotes = booking.client.notes || "";
      const newNoteContent = existingNotes
        ? `${existingNotes}\n- ${note}`
        : `- ${note}`;
      formData.append("notes", newNoteContent);
      formData.append("clientId", booking.client.id);
      const result = await updateClientNotes(
        { success: null, error: null },
        formData,
      );
      if (result.success) {
        toast.success("¡Éxito!", { description: result.success });
        onClose();
      }
      if (result.error) {
        toast.error("Error", { description: result.error as string });
      }
    });
  };

  const handleDeleteClient = () => {
    startClientDeleting(async () => {
      const result = await deleteClient(booking.client.id);
      if (result?.success) {
        toast.success("¡Cliente eliminado!", { description: result.success });
      }
      if (result?.error) {
        toast.error("Error", { description: result.error });
      }
      onClose();
    });
  };

  const isFutureBooking = new Date(booking.startTime) > new Date();
  const currentStatus = statusMap[booking.status];

  const handlePaymentMethodSelect = (
    method: PaymentMethod,
    isRetroactive: boolean = false,
  ) => {
    setSelectedPayment(method);
    if (isRetroactive) {
      setOptimisticPaymentSet(true);
      startCompleting(async () => {
        const result = await setPaymentMethod(booking.id, method);
        if (result.success) {
          toast.success(result.success);
        } else if (result.error) {
          toast.error(result.error);
          setOptimisticPaymentSet(false);
          setSelectedPayment(null);
        }
      });
    } else {
      handleStatusChange(BookingStatus.COMPLETED, method);
    }
  };

  const renderDetailsView = () => (
    <div className="space-y-4">
      <div className="space-y-1 text-sm">
        <p>
          <strong>Cliente:</strong> {booking.client.name}
        </p>
        <p>
          <strong>Teléfono:</strong> {booking.client.phone}
        </p>
        <p>
          <strong>Servicio:</strong>{" "}
          {booking.service?.name ?? "Servicio eliminado"}
        </p>
        <p>
          <strong>Fecha:</strong>{" "}
          <span className="capitalize">
            {formatLongDate(booking.startTime)}
          </span>
        </p>
        <p>
          <strong>Hora:</strong> {`${formatTime(booking.startTime)} hs`}
        </p>
        <p>
          <strong>Estado:</strong>{" "}
          <span className={cn("font-semibold", currentStatus.color)}>
            {currentStatus.text}
          </span>
        </p>
        {booking.status === BookingStatus.COMPLETED &&
          (booking.paymentMethod || optimisticPaymentSet) && (
            <p className="flex items-center gap-1.5">
              <strong>Cobro:</strong>{" "}
              {(() => {
                const method = booking.paymentMethod ?? selectedPayment;
                if (!method) return null;
                const config = getPaymentMethodConfig(method);
                const Icon = config.icon;
                return (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-medium",
                      config.textClass,
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </span>
                );
              })()}
            </p>
          )}
      </div>

      {booking.status === BookingStatus.COMPLETED &&
        !booking.paymentMethod &&
        !optimisticPaymentSet && (
          <div className="p-3 mt-4 space-y-3 bg-blue-50 rounded-md border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
            <p className="flex items-center text-sm font-medium text-blue-800 dark:text-blue-200">
              <Lightbulb className="flex-shrink-0 mr-2 w-4 h-4" />
              Falta registrar el método de cobro
            </p>
            <PaymentMethodPicker
              onSelect={(method) => handlePaymentMethodSelect(method, true)}
              isLoading={isCompleting}
              selectedMethod={selectedPayment}
              compact
            />
          </div>
        )}

      {booking.status === BookingStatus.COMPLETED &&
        !booking.paymentMethod &&
        optimisticPaymentSet &&
        selectedPayment && (
          <div className="p-3 mt-4 bg-green-50 rounded-md border border-green-200 dark:bg-green-950/30 dark:border-green-800">
            <p className="flex items-center text-sm font-medium text-green-700 dark:text-green-300">
              <Check className="flex-shrink-0 mr-2 w-4 h-4" />
              Cobro registrado: {getPaymentMethodConfig(selectedPayment).label}
            </p>
          </div>
        )}

      {booking.status === BookingStatus.SCHEDULED && (
        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setView("editTime")}
          >
            Cambiar horario
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isCancelling}
                className="w-full"
              >
                {isCancelling && (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                )}
                Cancelar Turno
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar este turno?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción marcará el turno como cancelado. No se podrá
                  revertir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Atrás</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={() => handleStatusChange(BookingStatus.CANCELLED)}
                  disabled={isCancelling}
                >
                  {isCancelling && (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  )}
                  Sí, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="default"
            disabled={isCompleting || isFutureBooking}
            className="w-full"
            onClick={() => setView("selectPayment")}
          >
            {isCompleting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
            Marcar como Completado
          </Button>
        </DialogFooter>
      )}
    </div>
  );

  const renderEditTimeView = () => (
    <div className="space-y-4">
      <div className="space-y-1 text-sm">
        <p>
          <strong>Cliente:</strong> {booking.client.name}
        </p>
        <p>
          <strong>Fecha:</strong>{" "}
          <span className="capitalize">
            {formatLongDate(booking.startTime)}
          </span>
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="newStartTime">Hora de inicio</Label>
          <input
            id="newStartTime"
            type="time"
            step={300}
            value={editingStartTime}
            onChange={(e) => setEditingStartTime(e.target.value)}
            className="flex px-3 py-2 mt-1 w-full h-10 text-sm rounded-md border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="newEndTime">Hora de fin</Label>
          <input
            id="newEndTime"
            type="time"
            step={300}
            value={editingEndTime}
            onChange={(e) => setEditingEndTime(e.target.value)}
            className="flex px-3 py-2 mt-1 w-full h-10 text-sm rounded-md border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">
          Duración: {calculatedDuration} min{" "}
          {calculatedDuration !== originalDuration && (
            <span className="font-normal text-muted-foreground">
              (original: {originalDuration} min)
            </span>
          )}
        </div>

        <div className="text-sm flex items-center min-h-[24px]">
          {availability.status === "checking" && (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Verificando disponibilidad...
            </div>
          )}
          {availability.status === "available" && (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="mr-2 w-4 h-4" />
              Horario disponible
            </div>
          )}
          {availability.status === "unavailable" && (
            <div className="flex items-center text-red-600">
              <XCircle className="mr-2 w-4 h-4" />
              {availability.reason}
            </div>
          )}
        </div>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Podés ajustar el turno en incrementos de 5 minutos.
      </p>

      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={() => setView("details")}>
          Volver
        </Button>
        <Button
          onClick={handleTimeChange}
          disabled={
            isTimeUpdating ||
            availability.status === "checking" ||
            availability.status === "unavailable"
          }
        >
          {isTimeUpdating && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
          Guardar cambios
        </Button>
      </DialogFooter>
    </div>
  );

  const renderSelectPaymentView = () => (
    <div className="space-y-4">
      <p className="mb-4 text-sm text-center text-muted-foreground">
        ¿Cómo pagó el cliente?
      </p>
      <PaymentMethodPicker
        onSelect={(method) => handlePaymentMethodSelect(method, false)}
        isLoading={isCompleting}
        selectedMethod={selectedPayment}
      />
      <DialogFooter className="mt-4">
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setView("details")}
          disabled={isCompleting}
        >
          Volver
        </Button>
      </DialogFooter>
    </div>
  );

  const renderAddNoteView = () => (
    <div className="space-y-4">
      <Label htmlFor="quickNote" className="font-semibold">
        Nota rápida
      </Label>
      <Textarea
        id="quickNote"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ej: Le gustó el corte con la 1 a los costados..."
      />
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose}>
          Omitir
        </Button>
        <Button onClick={handleAddNote} disabled={isNoteSaving}>
          {isNoteSaving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
          Guardar nota
        </Button>
      </DialogFooter>
    </div>
  );

  const renderConfirmDeleteClientView = () => (
    <div className="space-y-4 text-center">
      <p className="font-semibold">El turno ha sido cancelado.</p>
      <p className="text-sm text-muted-foreground">
        ¿Deseas también eliminar la ficha de este cliente?
      </p>
      <DialogFooter className="gap-2 sm:justify-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Sí, eliminar cliente</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es permanente y eliminará a{" "}
                <span className="font-semibold">{booking.client.name}</span>{" "}
                junto con todo su historial de turnos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, mantener</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDeleteClient}
                disabled={isClientDeleting}
              >
                {isClientDeleting && (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                )}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="secondary" onClick={onClose}>
          No, solo cerrar
        </Button>
      </DialogFooter>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case "addNote":
        return renderAddNoteView();
      case "confirmDeleteClient":
        return renderConfirmDeleteClientView();
      case "editTime":
        return renderEditTimeView();
      case "selectPayment":
        return renderSelectPaymentView();
      case "details":
      default:
        return renderDetailsView();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Detalles del Turno</DialogTitle>
        <DialogDescription>
          Gestiona el turno de{" "}
          <span className="font-semibold">{booking.client.name}</span>.
        </DialogDescription>
      </DialogHeader>
      {booking.paymentStatus === "PENDING" && view === "details" && (
        <div className="p-3 text-sm bg-amber-50 rounded-md border border-amber-300 dark:bg-amber-950/30 dark:border-amber-800">
          <p className="font-semibold text-amber-800 dark:text-amber-200">
            <Clock className="inline mr-1 w-4 h-4" /> Esperando pago de seña
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Este turno se cancelará automáticamente si el cliente no paga en los
            próximos minutos.
          </p>
        </div>
      )}
      {isFutureBooking &&
        view === "details" &&
        booking.paymentStatus !== "PENDING" && (
          <div className="p-3 text-xs text-center rounded-md border text-primary">
            Este es un turno futuro y aún no puede ser marcado como completado.
          </div>
        )}
      {renderContent()}
    </>
  );
}
