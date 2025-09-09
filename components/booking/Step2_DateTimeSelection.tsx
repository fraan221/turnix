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
  getStartOfDay,
  formatTime,
  isToday,
  formatFullDate,
} from "@/lib/date-helpers";
import { ArrowLeft, ArrowRight } from "lucide-react";
import TimeSlotsSkeleton from "@/components/skeletons/TimeSlotsSkeleton";
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

    const dayStartTime = new Date(date);
    dayStartTime.setHours(
      parseInt(workingHours.startTime.split(":")[0]),
      parseInt(workingHours.startTime.split(":")[1]),
      0,
      0
    );

    const dayEndTime = new Date(date);
    dayEndTime.setHours(
      parseInt(workingHours.endTime.split(":")[0]),
      parseInt(workingHours.endTime.split(":")[1]),
      0,
      0
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
      const slotEndTime = new Date(
        currentTime.getTime() + totalDuration * 60000
      );
      if (slotEndTime > dayEndTime) break;

      const overlapsWithBooking = bookings.some((booking) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(
          bookingStart.getTime() +
            (booking.service.durationInMinutes || 30) * 60000
        );
        return currentTime < bookingEnd && slotEndTime > bookingStart;
      });

      const overlapsWithTimeBlock = timeBlocks.some(
        (block) =>
          currentTime < new Date(block.endTime) &&
          slotEndTime > new Date(block.startTime)
      );

      slots.push({
        time: formatTime(currentTime),
        available: !overlapsWithBooking && !overlapsWithTimeBlock,
      });

      currentTime = new Date(currentTime.getTime() + totalDuration * 60000);
    }

    setTimeSlots(slots);
  }, [availability, totalDuration, date]);

  const handleNextClick = () => {
    if (date && selectedSlot) {
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const finalDate = new Date(date);
      finalDate.setHours(hours, minutes, 0, 0);
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
            disabled={(currentDate) => currentDate < getStartOfDay(new Date())}
          />
        </div>
        <div className="flex flex-col items-center">
          <h4 className="mb-4 font-semibold text-center">
            {date ? formatFullDate(date) : "Elige un día"}
          </h4>
          <div className="grid grid-cols-3 gap-2 pr-2 overflow-y-auto sm:grid-cols-4 max-h-64">
            {isLoading ? (
              <TimeSlotsSkeleton />
            ) : timeSlots.length > 0 ? (
              timeSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedSlot === slot.time ? "default" : "outline"}
                  onClick={() => slot.available && setSelectedSlot(slot.time)}
                  disabled={!slot.available}
                  className={cn(
                    !slot.available && "line-through text-muted-foreground"
                  )}
                >
                  {slot.time}
                </Button>
              ))
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
