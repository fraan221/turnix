"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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

  const serviceIds = useMemo(() => {
    return selectedServices.map((s) => s.id);
  }, [selectedServices]);

  const clientConfirmSchema = useMemo(() => {
    return z
      .object({
        clientName: z
          .string()
          .min(1, "El nombre es requerido.")
          .max(50, "El nombre no puede exceder los 50 caracteres."),
        clientPhone: z
          .string()
          .transform((val) => val.replace(/[\s-()]/g, ""))
          .pipe(
            z
              .string()
              .min(8, "El número de WhatsApp debe tener al menos 8 dígitos.")
          )
          .pipe(
            z
              .string()
              .max(
                15,
                "El número de WhatsApp no puede tener más de 15 dígitos."
              )
          )
          .pipe(
            z
              .string()
              .regex(
                /^[0-9]+$/,
                "El número de WhatsApp solo puede contener dígitos."
              )
          ),
        acceptPolicy: z.boolean().optional(),
      })
      .refine(
        (data) => {
          if (cancellationPolicy && !data.acceptPolicy) {
            return false;
          }
          return true;
        },
        {
          message: "Debes aceptar las políticas de cancelación.",
          path: ["acceptPolicy"],
        }
      );
  }, [cancellationPolicy]);

  type ClientConfirmFormValues = z.infer<typeof clientConfirmSchema>;

  const form = useForm<ClientConfirmFormValues>({
    resolver: zodResolver(clientConfirmSchema),
    mode: "onBlur",
    defaultValues: {
      clientName: "",
      clientPhone: "",
      acceptPolicy: false,
    },
  });

  useEffect(() => {
    if (isDialogOpen) {
      form.reset({
        clientName: "",
        clientPhone: "",
        acceptPolicy: false,
      });
    }
  }, [isDialogOpen, form]);

  async function onSubmit(data: ClientConfirmFormValues) {
    if (isPending) return;
    setIsPending(true);

    const formData = new FormData();
    formData.append("barberId", barberId);
    formData.append("serviceIds", serviceIds.join(","));
    formData.append("startTime", selectedDateTime.toISOString());
    formData.append("clientName", data.clientName);
    formData.append("clientPhone", data.clientPhone);
    if (data.acceptPolicy) {
      formData.append("acceptPolicy", "on");
    }

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

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Nombre y Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Número de Celular</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Ej: 1123456789"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {cancellationPolicy && (
                  <FormField
                    control={form.control}
                    name="acceptPolicy"
                    render={({ field }) => (
                      <FormItem className="flex gap-2 items-start space-y-0">
                        <FormControl>
                          <Checkbox
                            id="acceptPolicy"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="grid gap-1.5">
                          <Label
                            htmlFor="acceptPolicy"
                            className="text-sm font-normal leading-relaxed flex items-center gap-1.5 cursor-pointer"
                          >
                            Acepto las políticas de cancelación de turnos.
                            <button
                              type="button"
                              onClick={() => setShowPolicyDialog(true)}
                              className="transition-colors text-muted-foreground hover:text-primary"
                              aria-label="Ver política de cancelación"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </Label>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!form.formState.isValid || isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      {isRedirecting
                        ? "Redirigiendo a Mercado Pago..."
                        : "Reservando..."}
                    </>
                  ) : (
                    "Confirmar reserva"
                  )}
                </Button>
              </form>
            </Form>
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

