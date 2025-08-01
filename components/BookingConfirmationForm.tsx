"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPublicBooking } from "@/actions/public.actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";

interface BookingConfirmationFormProps {
  barberId: string;
  serviceIds: string[];
  startTime: string;
  onBookingSuccess: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        "Confirmar Reserva"
      )}
    </Button>
  );
}

export default function BookingConfirmationForm({
  barberId,
  serviceIds,
  startTime,
  onBookingSuccess,
}: BookingConfirmationFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(createPublicBooking, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Reserva Exitosa!", {
        description: state.success,
      });
      onBookingSuccess();
      router.push("/booking-confirmed");
    }

    if (state?.error) {
      toast.error("Error en la reserva", {
        description: state.error,
      });
    }
  }, [state, router, onBookingSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="barberId" value={barberId} />
      <input type="hidden" name="serviceIds" value={serviceIds.join(",")} />
      <input type="hidden" name="startTime" value={startTime} />

      <div>
        <Label htmlFor="clientName">Nombre y Apellido</Label>
        <Input id="clientName" name="clientName" required />
      </div>
      <div>
        <Label htmlFor="clientPhone">Número de WhatsApp</Label>
        <Input id="clientPhone" name="clientPhone" type="tel" required />
      </div>
      <SubmitButton />
    </form>
  );
}
