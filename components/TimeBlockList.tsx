"use client";

import { TimeBlock } from "@prisma/client";
import { Button } from "./ui/button";
import { deleteTimeBlock } from "@/actions/dashboard.actions";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, CalendarX, Calendar, Clock } from "lucide-react";
import Link from "next/link";
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

interface TimeBlockItemProps {
  block: TimeBlock;
}

function TimeBlockItem({ block }: TimeBlockItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTimeBlock(block.id);
      if (result?.success) {
        toast.success("Bloqueo eliminado", {
          description: "El horario ya está disponible para turnos",
        });
      }
      if (result?.error) {
        toast.error("Error al eliminar", {
          description: result.error,
        });
      }
    });
  };

  // Formatear fechas para mejor legibilidad
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const startDateTime = formatDateTime(block.startTime);
  const endDateTime = formatDateTime(block.endTime);

  return (
    <div className="flex flex-col justify-between gap-4 p-4 transition-colors border rounded-lg sm:flex-row sm:items-center bg-card hover:bg-accent/5">
      {/* Información del bloqueo */}
      <div className="flex-1 space-y-2">
        {/* Razón o título por defecto */}
        <div className="flex items-start gap-2">
          <CalendarX className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-foreground">
              {block.reason || "Horario bloqueado"}
            </p>
          </div>
        </div>

        {/* Fecha y hora */}
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground ml-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="break-all">
              {startDateTime} → {endDateTime}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 sm:shrink-0">
        <Link
          href={`/dashboard/schedule/${block.id}/edit`}
          className="flex-1 sm:flex-none"
        >
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Pencil className="w-4 h-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Editar</span>
          </Button>
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 sm:flex-none sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
              <span className="sm:hidden">Eliminar</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[420px] rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este bloqueo?</AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                El horario volverá a estar disponible para que tus clientes
                puedan agendar turnos. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <AlertDialogCancel className="w-full mt-0 sm:w-auto">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isPending}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

interface TimeBlockListProps {
  timeBlocks: TimeBlock[];
}

export default function TimeBlockList({ timeBlocks }: TimeBlockListProps) {
  // Estado vacío
  if (timeBlocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="p-3 mb-4 rounded-full bg-muted">
          <CalendarX className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium text-foreground">
          No hay bloqueos activos
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Todos tus horarios están disponibles para turnos. Creá un bloqueo
          cuando necesites reservar tiempo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeBlocks.map((block) => (
        <TimeBlockItem key={block.id} block={block} />
      ))}
    </div>
  );
}
