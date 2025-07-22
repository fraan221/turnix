"use client";

import { useState, useTransition } from "react";
import { Booking, Client, Service, BookingStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
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
  updateBookingStatus,
  updateClientNotes,
} from "@/actions/dashboard.actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Loader2 } from "lucide-react";

type BookingWithDetails = Booking & {
  service: Service;
  client: Client;
};

interface BookingDetailsDialogProps {
  booking: BookingWithDetails | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusMap = {
  [BookingStatus.SCHEDULED]: { text: "Agendado", color: "text-blue-600" },
  [BookingStatus.COMPLETED]: { text: "Completado", color: "text-green-600" },
  [BookingStatus.CANCELLED]: { text: "Cancelado", color: "text-red-600" },
};

export default function BookingDetailsDialog({
  booking,
  isOpen,
  onOpenChange,
}: BookingDetailsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteClientConfirm, setShowDeleteClientConfirm] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [note, setNote] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowAddNote(false);
      setShowDeleteClientConfirm(false);
      setNote("");
    }
    onOpenChange(open);
  };

  if (!booking) return null;

  const handleStatusChange = (newStatus: BookingStatus) => {
    startTransition(async () => {
      const result = await updateBookingStatus(booking.id, newStatus);
      if (result?.success) {
        toast.success("¡Éxito!", { description: result.success });
        if (newStatus === "COMPLETED") {
          setShowAddNote(true);
        } else if (newStatus === "CANCELLED") {
          setShowDeleteClientConfirm(true);
        }
      }
      if (result?.error) {
        toast.error("Error", { description: result.error });
      }
    });
  };

  const handleAddNote = () => {
    startTransition(async () => {
      const formData = new FormData();
      const existingNotes = booking.client.notes || "";
      const newNoteContent = existingNotes
        ? `${existingNotes}\n- ${note}`
        : `- ${note}`;
      formData.append("notes", newNoteContent);

      await updateClientNotes(booking.client.id, formData);
      toast.success("Nota añadida al cliente.");
      handleOpenChange(false);
    });
  };

  const handleDeleteClient = () => {
    startTransition(async () => {
      const result = await deleteClient(booking.client.id);
      if (result?.success) {
        toast.success("¡Cliente eliminado!", { description: result.success });
      }
      if (result?.error) {
        toast.error("Error", { description: result.error });
      }
      handleOpenChange(false);
    });
  };

  const currentStatus = statusMap[booking.status];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalles del Turno</DialogTitle>
          <DialogDescription>
            Gestiona el turno de{" "}
            <span className="font-semibold">{booking.client.name}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Vista principal del diálogo */}
        {!showAddNote && !showDeleteClientConfirm && (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <strong>Cliente:</strong> {booking.client.name}
              </p>
              <p>
                <strong>Teléfono:</strong> {booking.client.phone}
              </p>
              <p>
                <strong>Servicio:</strong> {booking.service.name}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                <span className="capitalize">
                  {format(
                    new Date(booking.startTime),
                    "EEEE d 'de' MMMM, yyyy",
                    { locale: es }
                  )}
                </span>
              </p>
              <p>
                <strong>Hora:</strong>{" "}
                {format(new Date(booking.startTime), "HH:mm 'hs'")}
              </p>
              <p>
                <strong>Estado:</strong>{" "}
                <span className={cn("font-semibold", currentStatus.color)}>
                  {currentStatus.text}
                </span>
              </p>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="destructive"
                onClick={() => handleStatusChange(BookingStatus.CANCELLED)}
                disabled={isPending || booking.status === "CANCELLED"}
              >
                Cancelar Turno
              </Button>
              <Button
                variant="default"
                onClick={() => handleStatusChange(BookingStatus.COMPLETED)}
                disabled={isPending || booking.status === "COMPLETED"}
              >
                Marcar como Completado
              </Button>
            </DialogFooter>
          </div>
        )}

        {showAddNote && (
          <div className="pt-4 space-y-4">
            <Label htmlFor="quickNote" className="font-semibold">
              Añadir Nota Rápida al Cliente
            </Label>
            <Textarea
              id="quickNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Le gustó el corte con la 1 a los costados..."
            />
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Omitir
              </Button>
              <Button onClick={handleAddNote} disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar Nota
              </Button>
            </DialogFooter>
          </div>
        )}

        {showDeleteClientConfirm && (
          <div className="pt-4 space-y-4 text-center">
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
                    <AlertDialogTitle>
                      ¿Estás absolutamente seguro?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción es permanente y eliminará a{" "}
                      <span className="font-semibold">
                        {booking.client.name}
                      </span>{" "}
                      junto con todo su historial de turnos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, mantener</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteClient}
                      disabled={isPending}
                    >
                      {isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="secondary"
                onClick={() => handleOpenChange(false)}
              >
                No, solo cerrar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
