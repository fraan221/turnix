"use client";

import { useState, useMemo, useEffect } from "react";
import type { Service } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { getBarberAvailability } from "@/actions/public.actions";
import {
  addMinutes,
  format,
  setHours,
  setMinutes,
  startOfDay,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AvailabilityData = {
  workingHours: {
    startTime: string;
    endTime: string;
    isWorking: boolean;
  } | null;
  bookings: {
    startTime: Date;
    service: { durationInMinutes: number | null };
  }[];
  timeBlocks: { startTime: Date; endTime: Date }[];
};

interface Step2DateTimeSelectionProps {
  barberId: string;
  selectedServices: Service[];
  onNext: (dateTime: Date) => void;
  onBack: () => void;
}

export function Step2_DateTimeSelection({
  barberId,
  selectedServices,
  onNext,
  onBack,
}: Step2DateTimeSelectionProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null
  );
  const [timeSlots, setTimeSlots] = useState<
    { time: string; available: boolean }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const totalDuration = useMemo(() => {
    if (selectedServices.length === 0) return 60;

    return selectedServices.reduce(
      (acc, service) => acc + (service.durationInMinutes || 60),
      0
    );
  }, [selectedServices]);

  useEffect(() => {
    if (!date) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      setSelectedSlot(null);
      const availabilityData = await getBarberAvailability(barberId, date);
      setAvailability(availabilityData as any);
      setIsLoading(false);
    };

    fetchAvailability();
  }, [date, barberId]);

  useEffect(() => {
    if (!availability || !date) return;

    if (!availability.workingHours?.isWorking) {
      setTimeSlots([]);
      return;
    }

    const { workingHours, bookings, timeBlocks } = availability;
    const slots: { time: string; available: boolean }[] = [];
    const now = new Date();

    const dayStartTime = setMinutes(
      setHours(date, parseInt(workingHours.startTime.split(":")[0])),
      parseInt(workingHours.startTime.split(":")[1])
    );
    const dayEndTime = setMinutes(
      setHours(date, parseInt(workingHours.endTime.split(":")[0])),
      parseInt(workingHours.endTime.split(":")[1])
    );

    let currentTime = isToday(date) && now > dayStartTime ? now : dayStartTime;
    if (isToday(date)) {
      const minutes = currentTime.getMinutes();
      if (minutes > 0 && minutes < 15) currentTime.setMinutes(15, 0, 0);
      else if (minutes > 15 && minutes < 30) currentTime.setMinutes(30, 0, 0);
      else if (minutes > 30 && minutes < 45) currentTime.setMinutes(45, 0, 0);
      else if (minutes > 45) {
        currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
      }
    }

    while (currentTime < dayEndTime) {
      const slotEndTime = addMinutes(currentTime, totalDuration);
      if (slotEndTime > dayEndTime) break;

      const overlapsWithBooking = bookings.some((booking) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = addMinutes(
          bookingStart,
          booking.service.durationInMinutes || 30
        );
        return currentTime < bookingEnd && slotEndTime > bookingStart;
      });

      const overlapsWithTimeBlock = timeBlocks.some(
        (block) =>
          currentTime < new Date(block.endTime) &&
          slotEndTime > new Date(block.startTime)
      );

      slots.push({
        time: format(currentTime, "HH:mm"),
        available: !overlapsWithBooking && !overlapsWithTimeBlock,
      });

      // El intervalo de avance ahora es la duración total del servicio.
      currentTime = addMinutes(currentTime, totalDuration);
    }

    setTimeSlots(slots);
  }, [availability, totalDuration, date]);

  const handleNextClick = () => {
    if (date && selectedSlot) {
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const finalDate = setMinutes(setHours(date, hours), minutes);
      onNext(finalDate);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 2: Elige fecha y hora</CardTitle>
        <CardDescription>
          Selecciona un día y luego un horario disponible para tu turno.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="p-0"
            disabled={(currentDate) => currentDate < startOfDay(new Date())}
            locale={es}
          />
        </div>
        <div className="flex flex-col items-center">
          <h4 className="mb-4 font-semibold text-center">
            {date ? format(date, "PPP", { locale: es }) : "Elige un día"}
          </h4>
          <div className="grid w-full grid-cols-3 gap-2 pr-2 overflow-y-auto sm:grid-cols-4 max-h-64">
            {isLoading ? (
              <div className="flex items-center justify-center col-span-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : timeSlots.length > 0 ? (
              timeSlots.map(
                (
                  slot // 👈 El map ahora recibe un objeto `slot`
                ) => (
                  <Button
                    key={slot.time}
                    variant={selectedSlot === slot.time ? "default" : "outline"}
                    onClick={() => slot.available && setSelectedSlot(slot.time)}
                    disabled={!slot.available} // 👈 Deshabilitado si no está disponible
                    className={cn(
                      !slot.available && "line-through text-muted-foreground" // 👈 Estilo de tachado
                    )}
                  >
                    {slot.time}
                  </Button>
                )
              )
            ) : (
              <p className="text-sm text-center col-span-full text-muted-foreground">
                No hay horarios disponibles para este día.
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button onClick={handleNextClick} disabled={!selectedSlot} size="lg">
          Siguiente
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
