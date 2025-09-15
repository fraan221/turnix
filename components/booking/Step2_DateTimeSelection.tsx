"use client";

import { useState, useMemo, useEffect } from "react";
import type { Service } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { getBarberAvailability } from "@/actions/public.actions";
import { getStartOfDay, formatFullDate } from "@/lib/date-helpers";
import { ArrowLeft, ArrowRight } from "lucide-react";
import TimeSlotsSkeleton from "@/components/skeletons/TimeSlotsSkeleton";
import { cn } from "@/lib/utils";

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
  const [timeSlots, setTimeSlots] = useState<TimeSlotGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const totalDuration = useMemo(() => {
    if (selectedServices.length === 0) return 60;
    return selectedServices[0]?.durationInMinutes || 60;
  }, [selectedServices]);

  useEffect(() => {
    if (!date) return;

    const fetchTimeSlots = async () => {
      setIsLoading(true);
      setSelectedSlot(null);
      const calculatedSlots = await getBarberAvailability(
        barberId,
        date,
        totalDuration
      );
      setTimeSlots(calculatedSlots);
      setIsLoading(false);
    };

    fetchTimeSlots();
  }, [date, barberId, totalDuration]);

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
              <TimeSlotsSkeleton />
            ) : timeSlots.length > 0 ? (
              timeSlots.map((group) => (
                <div key={group.shiftName}>
                  {timeSlots.length > 1 && (
                    <h5 className="mb-2 text-sm font-semibold text-center text-muted-foreground">
                      {group.shiftName}
                    </h5>
                  )}
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
