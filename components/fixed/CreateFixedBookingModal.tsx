"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createRecurringBooking } from "@/actions/fixed.actions";
import { RecurringBookingSchema } from "@/lib/schemas";

interface ClientProps {
  id: string;
  name: string;
  phone?: string | null;
}

interface ServiceProps {
  id: string;
  name: string;
  barber?: {
    name: string;
  } | null;
}

interface BarberProps {
  id: string;
  name: string;
}

interface CreateFixedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
  clients: ClientProps[];
  services: ServiceProps[];
  barbers: BarberProps[];
}

const DAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type RecurringBookingFormValues = z.infer<typeof RecurringBookingSchema>;

export function CreateFixedBookingModal({
  isOpen,
  onClose,
  role,
  clients,
  services,
  barbers,
}: CreateFixedBookingModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RecurringBookingFormValues>({
    resolver: zodResolver(RecurringBookingSchema),
    mode: "onChange",
    defaultValues: {
      clientId: "",
      serviceId: "",
      barberId: "",
      dayOfWeek: 1,
      startTime: "10:00",
      frequency: "WEEKLY",
    },
  });

  const resetForm = () => {
    form.reset({
      clientId: "",
      serviceId: "",
      barberId: "",
      dayOfWeek: 1,
      startTime: "10:00",
      frequency: "WEEKLY",
    });
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const onSubmit = async (values: RecurringBookingFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const result = await createRecurringBooking(values);
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
            Configurá un turno recurrente. Se generarán automáticamente las
            reservas en el calendario.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger id="clientId">
                        <SelectValue placeholder="Seleccioná un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <span className="block truncate max-w-[240px] sm:max-w-[320px]">
                            {client.name} {client.phone ? `- ${client.phone}` : ""}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Servicio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger id="serviceId">
                        <SelectValue placeholder="Seleccioná un servicio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <span className="block truncate max-w-[240px] sm:max-w-[320px]">
                            {barbers.length > 1 && service.barber
                              ? `${service.name} (${service.barber.name})`
                              : service.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === "OWNER" && (
              <FormField
                control={form.control}
                name="barberId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Barbero (Opcional)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "unassigned" ? "" : val)}
                      value={field.value || "unassigned"}
                    >
                      <FormControl>
                        <SelectTrigger id="barberId">
                          <SelectValue placeholder="Asignar a un barbero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Yo (Dueño)</SelectItem>
                        {barbers.map((barber) => (
                          <SelectItem key={barber.id} value={barber.id}>
                            {barber.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Día de la semana</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(parseInt(val, 10))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger id="dayOfWeek">
                          <SelectValue placeholder="Día" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_ES.map((day, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Horario</FormLabel>
                    <FormControl>
                      <Input
                        id="startTime"
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Frecuencia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Seleccioná frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WEEKLY">
                        Semanal (Todas las semanas)
                      </SelectItem>
                      <SelectItem value="BIWEEKLY">
                        Quincenal (Semana por medio)
                      </SelectItem>
                      <SelectItem value="MONTHLY">Mensual (1 vez al mes)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[0.8rem] text-muted-foreground mt-1">
                    {field.value === "MONTHLY"
                      ? "Se agendará el primer día de semana del mes."
                      : field.value === "BIWEEKLY"
                        ? "Se agendará empezando desde esta semana."
                        : ""}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader className="mr-2 w-4 h-4 animate-spin" />
                )}
                Crear Turno Fijo
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

