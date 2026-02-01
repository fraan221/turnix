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
import { createDepositPreference } from "@/actions/payment.actions";
import { ArrowLeft, Loader2, CalendarPlus, CreditCard } from "lucide-react";

type CreateBookingState = {
  success?: string | null;
  error?: string | null;
  requiresPayment?: boolean;
  bookingId?: string;
  depositAmount?: number;
  bookingDetails?: {
    clientName: string;
    barberPhone: string;
    barberName: string;
    serviceName: string;
    startTime: string;
    teamsEnabled: boolean;
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

function SubmitButton({ isRedirecting }: { isRedirecting: boolean }) {
  const { pending } = useFormStatus();

  if (isRedirecting) {
    return (
      <Button className="w-full" disabled>
        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
        Redirigiendo a Mercado Pago...
      </Button>
    );
  }

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  const [state, formAction] = useFormState<CreateBookingState, FormData>(
    createPublicBooking,
    null,
  );

  const serviceIds = useMemo(() => {
    return selectedServices.map((s) => s.id);
  }, [selectedServices]);

  useEffect(() => {
    async function handlePaymentRedirect(bookingId: string) {
      try {
        setIsRedirecting(true);
        const result = await createDepositPreference(bookingId);

        if (result.success && result.initPoint) {
          window.location.href = result.initPoint;
        } else {
          toast.error("Error al iniciar el pago", {
            description: result.error || "Intenta nuevamente más tarde",
          });
          setIsRedirecting(false);
        }
      } catch (error) {
        console.error("Payment redirect error:", error);
        toast.error("Error inesperado al iniciar el pago");
        setIsRedirecting(false);
      }
    }

    if (state?.requiresPayment && state.bookingId) {
      handlePaymentRedirect(state.bookingId);
      return;
    }

    if (state?.success && state.bookingDetails) {
      const queryParams = new URLSearchParams({
        client: state.bookingDetails.clientName,
        phone: state.bookingDetails.barberPhone,
        barberName: state.bookingDetails.barberName,
        serviceName: state.bookingDetails.serviceName,
        startTime: state.bookingDetails.startTime,
        teamsEnabled: String(state.bookingDetails.teamsEnabled),
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
      <div className="p-4 space-y-4 rounded-lg border">
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
      <div className="flex gap-2 justify-between">
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
              <SubmitButton isRedirecting={isRedirecting} />
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
