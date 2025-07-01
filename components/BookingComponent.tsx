"use client";

import { useState, useMemo, useEffect } from "react";
import { Service } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { getBarberAvailability } from "@/actions/public.actions";
import { addMinutes, format, setHours, setMinutes, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "./ui/button";
import { formatDuration, formatPrice } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { createPublicBooking } from "@/actions/public.actions";

interface BookingComponentProps {
  services: Service[];
  barberId: string;
}

type AvailabilityData = {
  workingHours: { startTime: string; endTime: string; isWorking: boolean } | null;
  bookings: { startTime: Date, service: { durationInMinutes: number } }[];
  timeBlocks: { startTime: Date; endTime: Date }[];
}

export default function BookingComponent({ services, barberId }: BookingComponentProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { totalDuration, totalPrice } = useMemo(() => {
    return selectedServices.reduce((acc, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        acc.totalDuration += service.durationInMinutes;
        acc.totalPrice += service.price;
      }
      return acc;
    }, { totalDuration: 0, totalPrice: 0 });
  }, [selectedServices, services]);

  useEffect(() => {
    if (!date) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      setTimeSlots([]);
      const availabilityData = await getBarberAvailability(barberId, date);
      setAvailability(availabilityData as any);
      setIsLoading(false);
    };

    fetchAvailability();
  }, [date, barberId]);

  useEffect(() => {
    if (!availability?.workingHours?.isWorking || totalDuration === 0) {
      setTimeSlots([]);
      return;
    }

    const { workingHours, bookings, timeBlocks } = availability;
    const slots: string[] = [];
    const dayStartTime = setMinutes(setHours(date!, parseInt(workingHours.startTime.split(':')[0])), parseInt(workingHours.startTime.split(':')[1]));
    const dayEndTime = setMinutes(setHours(date!, parseInt(workingHours.endTime.split(':')[0])), parseInt(workingHours.endTime.split(':')[1]));

    let currentTime = dayStartTime;

    while (currentTime < dayEndTime) {
      const slotEndTime = addMinutes(currentTime, totalDuration);

      if (slotEndTime > dayEndTime) break;

      const overlapsWithBooking = bookings.some(booking => {
        const bookingEndTime = addMinutes(booking.startTime, booking.service.durationInMinutes);
        return currentTime < bookingEndTime && slotEndTime > booking.startTime;
      });

      const overlapsWithTimeBlock = timeBlocks.some(block =>
        currentTime < block.endTime && slotEndTime > block.startTime
      );

      if (!overlapsWithBooking && !overlapsWithTimeBlock) {
        slots.push(format(currentTime, 'HH:mm'));
      }

      currentTime = addMinutes(currentTime, 60);
    }

    setTimeSlots(slots);
  }, [availability, totalDuration, date, services]);

  const handleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Nuestros Servicios</CardTitle>
          <CardDescription>Selecciona los servicios que deseas reservar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="flex items-center space-x-4 p-4 border rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 transition-colors">
                <Checkbox
                  id={service.id}
                  onCheckedChange={() => handleServiceSelection(service.id)}
                  checked={selectedServices.includes(service.id)}
                />
                <Label htmlFor={service.id} className="flex-1 cursor-pointer">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{formatDuration(service.durationInMinutes)}</p>
                    </div>
                    <p className="text-lg font-bold">{formatPrice(service.price)}</p>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedServices.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Elige una Fecha</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="p-0"
                    disabled={(currentDate) => currentDate < startOfDay(new Date())}
                  />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Elige un Horario</CardTitle>
                  <CardDescription>{date ? format(date, 'PPP', { locale: es }) : 'Selecciona un día'}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {isLoading ? (
                    <p className="text-sm text-center text-muted-foreground col-span-full">Cargando horarios...</p>
                  ) : timeSlots.length > 0 ? (
                    timeSlots.map(slot => (
                      <Button key={slot} variant="outline" onClick={() => handleSlotSelect(slot)}>
                        {slot}
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-center text-muted-foreground col-span-full">
                      No hay horarios disponibles.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-8 shadow-lg bottom-4">
            <CardHeader>
              <CardTitle>Resumen de tu Turno</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Duración Total:</p>
                <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
              </div>
              <div>
                <p className="font-semibold">Precio Total:</p>
                <p className="text-2xl font-bold">{formatPrice(totalPrice)}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirma tu Turno</DialogTitle>
            <DialogDescription>
              Estás a punto de reservar un turno para el {date ? format(date, 'PPP', { locale: es }) : ''} a las {selectedSlot}.
            </DialogDescription>
          </DialogHeader>
          <form action={createPublicBooking} className="space-y-4">
            <input type="hidden" name="barberId" value={barberId} />
            <input type="hidden" name="serviceId" value={selectedServices[0]} />
            <input type="hidden" name="startTime" value={date && selectedSlot ? new Date(`${format(date, 'yyyy-MM-dd')}T${selectedSlot}`).toISOString() : ''} />
            
            <div>
              <Label htmlFor="clientName">Nombre y Apellido</Label>
              <Input id="clientName" name="clientName" required />
            </div>
            <div>
              <Label htmlFor="clientPhone">Número de WhatsApp</Label>
              <Input id="clientPhone" name="clientPhone" type="tel" required />
            </div>
            <Button type="submit" className="w-full">Confirmar Reserva</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
