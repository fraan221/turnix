"use client";

import { useState, useMemo, useEffect } from "react";
import { Service } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { getBarberAvailability } from "@/actions/public.actions";
import { addMinutes, format, setHours, setMinutes, startOfDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "./ui/button";
import { formatDuration, formatPrice } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import BookingConfirmationForm from "./BookingConfirmationForm";
import { Loader2 } from "lucide-react";

interface BookingComponentProps {
  services: Service[];
  barberId: string;
}

type AvailabilityData = {
  workingHours: { startTime: string; endTime: string; isWorking: boolean } | null;
  bookings: { startTime: Date, service: { durationInMinutes: number | null } }[];
  timeBlocks: { startTime: Date; endTime: Date }[];
}

export default function BookingComponent({ services, barberId }: BookingComponentProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>("Selecciona un servicio para ver los horarios.");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const selectedServiceObjects = useMemo(() => {
    return services.filter(service => selectedServices.includes(service.id));
  }, [selectedServices, services]);

  const { totalDuration, totalPrice } = useMemo(() => {
    return selectedServiceObjects.reduce((acc, service) => {
      acc.totalDuration += service.durationInMinutes || 0;
      acc.totalPrice += service.price;
      return acc;
    }, { totalDuration: 0, totalPrice: 0 });
  }, [selectedServiceObjects]);

  useEffect(() => {
    if (!date) return;
    const fetchAvailability = async () => {
      setIsLoading(true);
      setTimeSlots([]);
      setAvailabilityMessage(null);
      const availabilityData = await getBarberAvailability(barberId, date);
      setAvailability(availabilityData as any);
      setIsLoading(false);
    };
    fetchAvailability();
  }, [date, barberId]);

  useEffect(() => {
    if (!availability) return;

    if (selectedServices.length === 0) {
      setTimeSlots([]);
      setAvailabilityMessage("Selecciona un servicio para ver los horarios.");
      return;
    }
    
    if (!availability.workingHours?.isWorking) {
      setTimeSlots([]);
      setAvailabilityMessage("El barbero no trabaja en el día seleccionado.");
      return;
    }

    const effectiveDuration = totalDuration > 0 ? totalDuration : 30;
    const { workingHours, bookings, timeBlocks } = availability;
    const slots: string[] = [];

    const now = new Date();
    let initialTime = startOfDay(date!);
    if (isToday(date!) && now > initialTime) {
      initialTime = now;
    }
    const dayStartTime = setMinutes(setHours(date!, parseInt(workingHours.startTime.split(':')[0])), parseInt(workingHours.startTime.split(':')[1]));
    const dayEndTime = setMinutes(setHours(date!, parseInt(workingHours.endTime.split(':')[0])), parseInt(workingHours.endTime.split(':')[1]));

    let currentTime = dayStartTime;

    if (isToday(date!) && currentTime < now) {
      const minutes = now.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 15) * 15;
      currentTime = setMinutes(setHours(now, now.getHours()), roundedMinutes);
      if (roundedMinutes >= 60) {
        currentTime = addMinutes(startOfDay(currentTime), 60);
      }
    }

    while (currentTime < dayEndTime) {
      const slotEndTime = addMinutes(currentTime, effectiveDuration);
      if (slotEndTime > dayEndTime) break;

      const overlapsWithBooking = bookings.some(booking => {
        const bookingDuration = booking.service.durationInMinutes || 30;
        const bookingEndTime = addMinutes(booking.startTime, bookingDuration);
        return currentTime < bookingEndTime && slotEndTime > booking.startTime;
      });

      const overlapsWithTimeBlock = timeBlocks.some(block =>
        currentTime < block.endTime && slotEndTime > block.startTime
      );

      if (!overlapsWithBooking && !overlapsWithTimeBlock) {
        slots.push(format(currentTime, 'HH:mm'));
      }

      currentTime = addMinutes(currentTime, 15);
    }

    setTimeSlots(slots);
    
    if (slots.length === 0) {
      setAvailabilityMessage("No hay horarios disponibles para este día.");
    } else {
      setAvailabilityMessage(null);
    }
  }, [availability, totalDuration, date, selectedServices]);

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
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{service.name}</h3>
                      {service.description && <p className="text-xs text-muted-foreground">{service.description}</p>}
                      {service.durationInMinutes && (
                        <p className="text-sm font-medium text-muted-foreground">{formatDuration(service.durationInMinutes)}</p>
                      )}
                    </div>
                    <p className="ml-4 text-lg font-bold shrink-0">{formatPrice(service.price)}</p>
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
                <CardHeader><CardTitle>Elige una Fecha</CardTitle></CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar mode="single" selected={date} onSelect={setDate} className="p-0" disabled={(currentDate) => currentDate < startOfDay(new Date())} />
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
                        <div className="flex items-center justify-center col-span-full">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : timeSlots.length > 0 ? (
                        timeSlots.map(slot => (
                          <Button key={slot} variant="outline" onClick={() => handleSlotSelect(slot)}>{slot}</Button>
                        ))
                      ) : (
                        <p className="text-sm text-center text-muted-foreground col-span-full">
                          {availabilityMessage}
                        </p>
                      )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-8 shadow-lg">
            <CardHeader>
              <CardTitle>Resumen de tu Turno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pb-4 space-y-2 border-b">
                <h4 className="font-semibold">Servicios Seleccionados:</h4>
                {selectedServiceObjects.map(service => (
                  <div key={service.id} className="flex justify-between text-sm text-muted-foreground">
                    <span>{service.name}</span>
                    <span className="font-medium">{formatPrice(service.price)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end">
                  <p className="mr-2 font-semibold">Precio Total:</p>
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
          <BookingConfirmationForm 
            barberId={barberId}
            serviceIds={selectedServices}
            startTime={date && selectedSlot ? new Date(`${format(date, 'yyyy-MM-dd')}T${selectedSlot}`).toISOString() : ''}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}