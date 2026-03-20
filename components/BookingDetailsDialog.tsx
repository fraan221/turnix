"use client";

import { useState, useTransition, useEffect } from "react";
import { Booking, Client, Service, BookingStatus } from "@prisma/client";
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
} from "@/actions/dashboard.actions";
import { formatLongDate, formatTime } from "@/lib/date-helpers";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Loader2 } from "lucide-react";

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

type DialogView = "details" | "addNote" | "confirmDeleteClient" | "editTime";

const statusMap = {
  [BookingStatus.SCHEDULED]: { text: "Agendado", color: "text-blue-600" },
  [BookingStatus.COMPLETED]: { text: "Completado", color: "text-green-600" },
  [BookingStatus.CANCELLED]: { text: "Cancelado", color: "text-red-600" },
};

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
  const [editingTime, setEditingTime] = useState("");

  useEffect(() => {
    setView("details");
    setNote(booking.client.notes || "");
    setEditingTime(
      new Date(booking.startTime).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    );
  }, [booking.id, booking.client.notes]);

  const handleTimeChange = () => {
    if (!editingTime) {
      toast.error("Error", {
        description: "Seleccioná una hora válida.",
      });
      return;
    }

    const [hours, minutes] = editingTime.split(":").map(Number);
    const newStartTime = new Date(booking.startTime);
    newStartTime.setHours(hours, minutes, 0, 0);

    startTimeUpdating(async () => {
      const result = await updateBookingTime(booking.id, newStartTime);

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

  const handleStatusChange = (newStatus: BookingStatus) => {
    onOptimisticUpdate(booking.id, newStatus);
    const transition =
      newStatus === "COMPLETED" ? startCompleting : startCancelling;
    transition(async () => {
      const result = await updateBookingStatus(booking.id, newStatus);
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
      </div>
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
              <Button variant="destructive" disabled={isCancelling} className="w-full">
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                disabled={isCompleting || isFutureBooking}
                className="w-full"
              >
                {isCompleting && (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                )}
                Marcar como Completado
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar turno?</AlertDialogTitle>
                <AlertDialogDescription>
                  Estás a punto de marcar este turno como completado. Esta
                  acción registrará el servicio como finalizado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Atrás</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleStatusChange(BookingStatus.COMPLETED)}
                  disabled={isCompleting}
                >
                  {isCompleting && (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  )}
                  Sí, confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
          <span className="capitalize">{formatLongDate(booking.startTime)}</span>
        </p>
      </div>

      <div>
        <Label htmlFor="newTime">Nueva hora</Label>
        <input
          id="newTime"
          type="time"
          step={300}
          value={editingTime}
          onChange={(e) => setEditingTime(e.target.value)}
          className="flex px-3 py-2 mt-1 w-full h-10 text-sm rounded-md border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Podés ajustar el turno en incrementos de 5 minutos.
        </p>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={() => setView("details")}>
          Volver
        </Button>
        <Button onClick={handleTimeChange} disabled={isTimeUpdating}>
          {isTimeUpdating && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
          Guardar horario
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
            ⏳ Esperando pago de seña
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
