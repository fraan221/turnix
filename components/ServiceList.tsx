"use client";

import { Service } from "@prisma/client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Scissors, Clock, DollarSign, Trash2 } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";
import { deleteService } from "@/actions/service.actions";
import { Button } from "./ui/button";
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

interface ServiceItemProps {
  service: Service;
  hasRecurringBookings: boolean;
  futureBookingsCount: number;
}

function ServiceItem({ service, hasRecurringBookings, futureBookingsCount }: ServiceItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      setIsDeleteDialogOpen(false);
      const result = await deleteService(service.id);
      if (result?.success) {
        toast.success("Servicio eliminado.", {
          description: `"${service.name}" fue eliminado correctamente.`,
        });
      }
      if (result?.error) {
        toast.error("No se pudo eliminar.", {
          description: result.error,
        });
      }
    });
  };

  return (
    <>
      <li className="relative flex flex-col p-4 transition-all duration-200 border-2 group rounded-xl hover:border-primary/50 hover:shadow-md bg-card">
        <div className="flex-1 space-y-2">
          <h3 className="pr-24 text-base font-semibold sm:text-lg text-foreground">
            {service.name}
          </h3>

          {service.description && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>{formatPrice(service.price)}</span>
            </div>

            {service.durationInMinutes && service.durationInMinutes > 0 && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(service.durationInMinutes)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="size-9 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            <Link href={`/dashboard/services/${service.id}/edit`}>
              <Pencil className="size-4" />
              <span className="sr-only">Editar servicio {service.name}</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="size-9 transition-all text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Eliminar servicio {service.name}</span>
          </Button>
        </div>
      </li>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar &quot;{service.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {hasRecurringBookings ? (
                  <>
                    <p>Este servicio tiene turnos fijos asociados.</p>
                    <p className="text-sm text-muted-foreground">
                      Cancelá los turnos fijos primero desde la sección Turnos Fijos.
                    </p>
                  </>
                ) : futureBookingsCount > 0 ? (
                  <>
                    <p>Esta acción es irreversible.</p>
                    <p className="text-sm text-muted-foreground">
                      {futureBookingsCount} turnos programados quedarán sin servicio.
                    </p>
                  </>
                ) : (
                  <p>Esta acción es irreversible.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending || hasRecurringBookings}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ServiceListProps {
  services: Service[];
  servicesWithRecurringInfo?: Array<{
    service: Service;
    hasRecurringBookings: boolean;
    futureBookingsCount: number;
  }>;
}

export default function ServiceList({ services, servicesWithRecurringInfo }: ServiceListProps) {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 border-2 border-dashed rounded-xl bg-muted/30">
        <div className="p-4 mb-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 drop-shadow-sm">
          <Scissors className="w-8 h-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-center">
          Todavía no tenés servicios
        </h3>
        <p className="max-w-sm text-sm text-center text-muted-foreground">
          Usá el botón «Crear Servicio» para que tus clientes puedan reservar turnos
        </p>
      </div>
    );
  }

  if (servicesWithRecurringInfo) {
    return (
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {servicesWithRecurringInfo.map(({ service, hasRecurringBookings, futureBookingsCount }) => (
          <ServiceItem
            key={service.id}
            service={service}
            hasRecurringBookings={hasRecurringBookings}
            futureBookingsCount={futureBookingsCount}
          />
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {services.map((service) => (
        <ServiceItem
          key={service.id}
          service={service}
          hasRecurringBookings={false}
          futureBookingsCount={0}
        />
      ))}
    </ul>
  );
}