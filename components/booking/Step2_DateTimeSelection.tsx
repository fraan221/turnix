"use client";

import { useState, useMemo, useEffect } from "react";
import type { Service, WorkShiftType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { getBarberAvailability } from "@/actions/public.actions";
import {
  getStartOfDay,
  formatTime,
  isToday,
  formatFullDate,
} from "@/lib/date-helpers";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import TimeSlotsSkeleton from "@/components/skeletons/TimeSlotsSkeleton";
import { cn } from "@/lib/utils";

const shiftNames: Record<WorkShiftType, string> = {
  MORNING: "Mañana",
  AFTERNOON: "Tarde",
  NIGHT: "Noche",
};

type AvailabilityData = {
  isWorking: boolean;
  shifts: {
    type: WorkShiftType;
    startTime: string;
    endTime: string;
  }[];
  bookings: {
    startTime: Date;
    service: { durationInMinutes: number | null };
  }[];
  timeBlocks: { startTime: Date; endTime: Date }[];
};

type TimeSlotGroup = {
  shiftName: string;
  slots: { time: string; available: boolean }[];
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
  const [timeSlots, setTimeSlots] = useState<TimeSlotGroup[]>([]);
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
    if (
      !availability ||
      !date ||
      !availability.isWorking ||
      availability.shifts.length === 0
    ) {
      setTimeSlots([]);
      return;
    }

    const { shifts, bookings, timeBlocks } = availability;
    const slotGroups: TimeSlotGroup[] = [];
    const now = new Date();

    for (const shift of shifts) {
      const shiftSlots: { time: string; available: boolean }[] = [];
      const dayStartTime = new Date(date);
      dayStartTime.setHours(
        parseInt(shift.startTime.split(":")[0]),
        parseInt(shift.startTime.split(":")[1]),
        0,
        0
      );

      const dayEndTime = new Date(date);
      dayEndTime.setHours(
        parseInt(shift.endTime.split(":")[0]),
        parseInt(shift.endTime.split(":")[1]),
        0,
        0
      );

      let currentTime =
        isToday(date) && now > dayStartTime ? now : dayStartTime;

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

        shiftSlots.push({
          time: formatTime(currentTime),
          available: !overlapsWithBooking && !overlapsWithTimeBlock,
        });

        currentTime = new Date(currentTime.getTime() + totalDuration * 60000);
      }

      if (shiftSlots.length > 0) {
        slotGroups.push({
          shiftName: shiftNames[shift.type],
          slots: shiftSlots,
        });
      }
    }

    setTimeSlots(slotGroups);
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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Paso 2: Elige fecha y hora</h3>
        <p className="text-muted-foreground">
          Selecciona un día y luego un horario disponible para tu turno.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="p-0"
            disabled={(currentDate) => currentDate < getStartOfDay(new Date())}
          />
        </div>
        <div className="flex flex-col">
          <h4 className="mb-4 font-semibold text-center">
            {date ? formatFullDate(date) : "Elige un día"}
          </h4>
          <div className="pr-2 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center pt-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : timeSlots.length > 0 ? (
              timeSlots.map((group) => (
                <div key={group.shiftName}>
                  <h5 className="mb-2 text-sm font-semibold text-center text-muted-foreground">
                    {group.shiftName}
                  </h5>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
                    {group.slots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={
                          selectedSlot === slot.time ? "default" : "outline"
                        }
                        onClick={() =>
                          slot.available && setSelectedSlot(slot.time)
                        }
                        disabled={!slot.available}
                        className={cn(
                          !slot.available &&
                            "line-through text-muted-foreground"
                        )}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="pt-8 text-sm text-center text-muted-foreground">
                No hay horarios disponibles para este día.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button onClick={handleNextClick} disabled={!selectedSlot} size="lg">
          Siguiente
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
