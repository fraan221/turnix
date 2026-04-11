"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRecurringBooking } from "@/actions/fixed.actions";
import { RecurringBookingSchema } from "@/lib/schemas";

interface CreateFixedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
  clients: any[];
  services: any[];
  barbers: any[];
}

const DAYS_ES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export function CreateFixedBookingModal({ 
  isOpen, 
  onClose, 
  role,
  clients,
  services,
  barbers
}: CreateFixedBookingModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("10:00");
  const [frequency, setFrequency] = useState("WEEKLY");

  const resetForm = () => {
    setClientId("");
    setServiceId("");
    setBarberId("");
    setDayOfWeek("1");
    setStartTime("10:00");
    setFrequency("WEEKLY");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      clientId,
      serviceId,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      frequency: frequency as any,
      ...(barberId && barberId !== "unassigned" ? { barberId } : {})
    };

    const parsed = RecurringBookingSchema.safeParse(payload);
    
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setIsSubmitting(false);
      return;
    }

    const result = await createRecurringBooking(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      toast.success(result.success);
      resetForm();
      onClose();
      router.refresh();
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Turno Fijo</DialogTitle>
          <DialogDescription>
            Configurá un turno recurrente. Se generarán automáticamente las reservas en el calendario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger id="clientId">
                <SelectValue placeholder="Seleccioná un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.phone ? `- ${client.phone}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceId">Servicio</Label>
            <Select value={serviceId} onValueChange={setServiceId} required>
              <SelectTrigger id="serviceId">
                <SelectValue placeholder="Seleccioná un servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === "OWNER" && (
            <div className="space-y-2">
              <Label htmlFor="barberId">Barbero (Opcional)</Label>
              <Select value={barberId} onValueChange={setBarberId}>
                <SelectTrigger id="barberId">
                  <SelectValue placeholder="Asignar a un barbero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Yo (Dueño)</SelectItem>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Día de la semana</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek} required>
                <SelectTrigger id="dayOfWeek">
                  <SelectValue placeholder="Día" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_ES.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Horario</Label>
              <Input 
                id="startTime" 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frecuencia</Label>
            <Select value={frequency} onValueChange={setFrequency} required>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Seleccioná frecuencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Semanal (Todas las semanas)</SelectItem>
                <SelectItem value="BIWEEKLY">Quincenal (Semana por medio)</SelectItem>
                <SelectItem value="MONTHLY">Mensual (1 vez al mes)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[0.8rem] text-muted-foreground mt-1">
              {frequency === "MONTHLY" 
                ? "Se agendará el primer día de semana del mes."
                : frequency === "BIWEEKLY"
                ? "Se agendará empezando desde esta semana."
                : ""}
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Turno Fijo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
