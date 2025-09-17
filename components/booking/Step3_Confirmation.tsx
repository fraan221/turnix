"use client";

import { useState, useMemo, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Service } from "@prisma/client";
import { formatShortDateTime } from "@/lib/date-helpers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { createPublicBooking } from "@/actions/public.actions";
import { ArrowLeft, Loader2, CalendarPlus } from "lucide-react";

type CreateBookingState = {
  success?: string | null;
  error?: string | null;
  bookingDetails?: {
    clientName: string;
    barberPhone: string;
    barberName: string;
  } | null;
} | null;

interface Step3ConfirmationProps {
  barberId: string;
  barberName: string;
  selectedServices: Service[];
  selectedDateTime: Date;
  onBack: () => void;
  hasMultipleBarbers: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Reservando...
        </>
      ) : (
        "Confirmar reserva"
      )}
    </Button>
  );
}

export function Step3_Confirmation({
  barberId,
  barberName,
  selectedServices,
  selectedDateTime,
  onBack,
  hasMultipleBarbers,
}: Step3ConfirmationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const [state, formAction] = useFormState<CreateBookingState, FormData>(
    createPublicBooking,
    null
  );

  const serviceIds = useMemo(() => {
    return selectedServices.map((s) => s.id);
  }, [selectedServices]);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Reserva Exitosa!", { description: state.success });

      const queryParams = new URLSearchParams({
        client: state.bookingDetails?.clientName || "",
        phone: state.bookingDetails?.barberPhone || "",
        barberName: state.bookingDetails?.barberName || "",
      });
      router.push(`/booking-confirmed?${queryParams.toString()}`);
    }
    if (state?.error) {
      toast.error("Error al reservar", { description: state.error });
    }
  }, [state, router]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Paso 3: Confirma tu turno</h3>
        <p className="text-muted-foreground">
          Revisa los detalles de tu turno y completa tus datos para finalizar.
        </p>
      </div>
      <div className="p-4 space-y-4 border rounded-lg">
        <div>
          <h3 className="mb-2 font-semibold">Servicio</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {selectedServices.map((service) => (
              <li key={service.id} className="flex justify-between">
                <span>{service.name}</span>
                <span className="font-medium">
                  {formatPrice(service.price)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {hasMultipleBarbers && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold">Barbero</h3>
              <p className="text-sm text-muted-foreground">{barberName}</p>
            </div>
          </>
        )}
        <Separator />
        <div>
          <h3 className="font-semibold">Día y Hora</h3>
          <p className="text-sm text-muted-foreground">
            {formatShortDateTime(selectedDateTime)}
          </p>
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <CalendarPlus className="w-4 h-4" />
              Completar reserva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finaliza tu reserva</DialogTitle>
              <DialogDescription>
                Completa tus datos para confirmar el turno.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="barberId" value={barberId} />
              <input
                type="hidden"
                name="serviceIds"
                value={serviceIds.join(",")}
              />
              <input
                type="hidden"
                name="startTime"
                value={selectedDateTime.toISOString()}
              />
              <div>
                <Label htmlFor="clientName">Nombre y Apellido</Label>
                <Input id="clientName" name="clientName" required />
              </div>
              <div>
                <Label htmlFor="clientPhone">Número de Celular</Label>
                <Input
                  id="clientPhone"
                  name="clientPhone"
                  type="tel"
                  required
                />
              </div>
              <SubmitButton />
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
