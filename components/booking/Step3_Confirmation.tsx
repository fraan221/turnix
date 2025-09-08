"use client";

import { useState, useMemo, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Service } from "@prisma/client";
import { formatConfirmationDateTime } from "@/lib/date-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Loader2 } from "lucide-react";

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
        "Confirmar Reserva"
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
}: Step3ConfirmationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const [state, formAction] = useFormState<CreateBookingState, FormData>(
    createPublicBooking,
    null
  );

  const { totalPrice, serviceIds } = useMemo(() => {
    const total = selectedServices.reduce((acc, s) => acc + s.price, 0);
    const ids = selectedServices.map((s) => s.id);
    return { totalPrice: total, serviceIds: ids };
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
    <Card>
      <CardHeader>
        <CardTitle>Paso 3: Confirma tu turno</CardTitle>
        <CardDescription>
          Revisa los detalles de tu turno y completa tus datos para finalizar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-2 font-semibold">Servicios</h3>
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
        <Separator />
        <div>
          <h3 className="font-semibold">Barbero</h3>
          <p className="text-sm text-muted-foreground">{barberName}</p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold">Día y Hora</h3>
          <p className="text-sm capitalize text-muted-foreground">
            {formatConfirmationDateTime(selectedDateTime)}
          </p>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">Completar Reserva</Button>
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
      </CardFooter>
    </Card>
  );
}
