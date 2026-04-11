"use client";

import { useState, useMemo } from "react";
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

interface Step3ConfirmationProps {
  barberId: string;
  barberName: string;
  barbershopName: string;
  selectedServices: Service[];
  selectedDateTime: Date;
  cancellationPolicy: string | null;
  onBack: () => void;
  hasMultipleBarbers: boolean;
  onBookingComplete: () => void;
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
  onBookingComplete,
}: Step3ConfirmationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const serviceIds = useMemo(() => {
    return selectedServices.map((s) => s.id);
  }, [selectedServices]);

  const isFormReady = useMemo(() => {
    const hasName = clientName.trim().length > 0;
    const hasPhone = clientPhone.trim().length > 0;
    const policyIsValid = !cancellationPolicy || policyAccepted;

    return hasName && hasPhone && policyIsValid;
  }, [clientName, clientPhone, cancellationPolicy, policyAccepted]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createPublicBooking(null, formData);

      // Payment redirect
      if (result?.requiresPayment && result.bookingId) {
        onBookingComplete();
        setIsDialogOpen(false);
        setIsRedirecting(true);

        try {
          const paymentResult = await createDepositPreference(result.bookingId);
          if (paymentResult.success && paymentResult.initPoint) {
            window.location.href = paymentResult.initPoint;
          } else {
            toast.error("Error al iniciar el pago", {
              description:
                paymentResult.error || "Intenta nuevamente más tarde",
            });
            setIsRedirecting(false);
            setIsPending(false);
          }
        } catch {
          toast.error("Error inesperado al iniciar el pago");
          setIsRedirecting(false);
          setIsPending(false);
        }
        return;
      }

      // Success — navigate immediately
      if (result?.success && result.bookingDetails) {
        onBookingComplete();
        setIsDialogOpen(false);

        const queryParams = new URLSearchParams({
          client: result.bookingDetails.clientName,
          phone: result.bookingDetails.barberPhone,
          barberName: result.bookingDetails.barberName,
          serviceName: result.bookingDetails.serviceName,
          startTime: result.bookingDetails.startTime,
          teamsEnabled: String(result.bookingDetails.teamsEnabled),
        });

        window.location.href = `/booking-confirmed?${queryParams.toString()}`;
        return;
      }

      // Error
      if (result?.error) {
        toast.error("Error al reservar", { description: result.error });
        setIsPending(false);

        if (result.slotTaken) {
          setTimeout(() => {
            onBack();
          }, 2000);
        }
      }
    } catch (error) {
      console.error("[Booking] Error inesperado:", error);
      toast.error("Error inesperado al crear la reserva");
      setIsPending(false);
    }
  }

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

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button
                type="submit"
                className="w-full"
                disabled={!isFormReady || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isRedirecting
                      ? "Redirigiendo a Mercado Pago..."
                      : "Reservando..."}
                  </>
                ) : (
                  "Confirmar reserva"
                )}
              </Button>
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
