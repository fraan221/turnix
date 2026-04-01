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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { createPublicBooking } from "@/actions/public.actions";
import { createDepositPreference } from "@/actions/payment.actions";
import { ArrowLeft, Loader2, CalendarPlus, Info } from "lucide-react";

type CreateBookingState = {
  success?: string | null;
  error?: string | null;
  requiresPayment?: boolean;
  bookingId?: string;
  depositAmount?: number;
  slotTaken?: boolean;
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
  barbershopName: string;
  selectedServices: Service[];
  selectedDateTime: Date;
  cancellationPolicy: string | null;
  onBack: () => void;
  hasMultipleBarbers: boolean;
}

function SubmitButton({
  isRedirecting,
  isDisabled,
}: {
  isRedirecting: boolean;
  isDisabled: boolean;
}) {
  const { pending } = useFormStatus();

  if (isRedirecting) {
    return (
      <Button className="w-full" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Redirigiendo a Mercado Pago...
      </Button>
    );
  }

  return (
    <Button type="submit" className="w-full" disabled={pending || isDisabled}>
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
  barbershopName,
  selectedServices,
  selectedDateTime,
  cancellationPolicy,
  onBack,
  hasMultipleBarbers,
}: Step3ConfirmationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const router = useRouter();

  const [state, formAction] = useFormState<CreateBookingState, FormData>(
    createPublicBooking,
    null,
  );

  const serviceIds = useMemo(() => {
    return selectedServices.map((s) => s.id);
  }, [selectedServices]);

  const isFormReady = useMemo(() => {
    const isValidName = (name: string) => name.trim().length > 0;
    const isValidPhone = (phone: string) => phone.trim().length > 0;

    const hasName = isValidName(clientName);
    const hasPhone = isValidPhone(clientPhone);
    const policyIsValid = !cancellationPolicy || policyAccepted;

    return hasName && hasPhone && policyIsValid;
  }, [clientName, clientPhone, cancellationPolicy, policyAccepted]);

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

      if (state.slotTaken) {
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    }
  }, [state, router, onBack]);

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
                <span className="font-medium">{formatPrice(service.price)}</span>
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
              <input type="hidden" name="serviceIds" value={serviceIds.join(",")} />
              <input
                type="hidden"
                name="startTime"
                value={selectedDateTime.toISOString()}
              />

              <div>
                <Label htmlFor="clientName">Nombre y Apellido</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="clientPhone">Número de Celular</Label>
                <Input
                  id="clientPhone"
                  name="clientPhone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                />
              </div>

              {cancellationPolicy && (
                <div className="flex gap-2 items-start">
                  <Checkbox
                    id="acceptPolicy"
                    name="acceptPolicy"
                    checked={policyAccepted}
                    onCheckedChange={(checked) =>
                      setPolicyAccepted(checked === true)
                    }
                    className="mt-1"
                  />
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="acceptPolicy"
                      className="text-sm font-normal leading-relaxed flex items-center gap-1.5"
                    >
                      Acepto las políticas de cancelación de turnos.
                      <button
                        type="button"
                        onClick={() => setShowPolicyDialog(true)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Ver política de cancelación"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </Label>
                  </div>
                </div>
              )}

              <SubmitButton
                isRedirecting={isRedirecting}
                isDisabled={!isFormReady}
              />
            </form>
          </DialogContent>
        </Dialog>

        {cancellationPolicy && (
          <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Política de Cancelación</DialogTitle>
              </DialogHeader>

              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground max-h-[50vh] overflow-y-auto">
                {cancellationPolicy}
              </p>

              <DialogFooter className="pt-2 border-t">
                <p className="w-full text-xs text-right text-muted-foreground">
                  {barbershopName}
                </p>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
