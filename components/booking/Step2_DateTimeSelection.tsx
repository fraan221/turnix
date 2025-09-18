"use client";

import { useState, useMemo, useEffect } from "react";
import type { Service } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  getBarberAvailability,
  BarberAvailability,
} from "@/actions/public.actions";
import { formatFullDate } from "@/lib/date-helpers";
import { ArrowLeft, ArrowRight } from "lucide-react";
import TimeSlotsSkeleton from "@/components/skeletons/TimeSlotsSkeleton";
import { cn } from "@/lib/utils";

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
  const [availability, setAvailability] = useState<BarberAvailability | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const totalDuration = useMemo(() => {
    return selectedServices[0]?.durationInMinutes ?? 60;
  }, [selectedServices]);

  useEffect(() => {
    if (!date) {
      setIsLoading(false);
      return;
    }

    const fetchTimeSlots = async () => {
      setIsLoading(true);
      setSelectedSlot(null);

      const availabilityData = await getBarberAvailability(
        barberId,
        date,
        totalDuration
      );

      setAvailability(availabilityData);
      setIsLoading(false);
    };

    fetchTimeSlots();
  }, [date, barberId, totalDuration]);

  const handleNextClick = () => {
    if (date && selectedSlot) {
      const dateString = date.toISOString().split("T")[0];
      const isoString = `${dateString}T${selectedSlot}:00-03:00`;
      const finalDate = new Date(isoString);
      onNext(finalDate);
    }
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const renderTimeSlots = () => {
    if (isLoading) {
      return <TimeSlotsSkeleton />;
    }

    if (!availability || availability.status !== "AVAILABLE") {
      let message = "No hay horarios disponibles para este día.";
      if (availability) {
        switch (availability.status) {
          case "WORKDAY_OVER":
            message = "La jornada laboral de hoy ha terminado.";
            break;
          case "FULLY_BOOKED":
            message = "No quedan turnos disponibles para este día.";
            break;
          case "DAY_OFF":
            message = "El barbero no trabaja este día.";
            break;
        }
      }
      return (
        <p className="pt-8 text-sm text-center text-muted-foreground">
          {message}
        </p>
      );
    }

    return availability.slotGroups.map((group) => (
      <div key={group.shiftName}>
        {availability.slotGroups.length > 1 && (
          <h5 className="mb-2 text-sm font-semibold text-center text-muted-foreground">
            {group.shiftName}
          </h5>
        )}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
          {group.slots.map((slot) => (
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
          ))}
        </div>
      </div>
    ));
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
            disabled={(currentDate) => currentDate < yesterday}
          />
        </div>
        <div className="flex flex-col">
          <h4 className="mb-4 font-semibold text-center">
            {date ? formatFullDate(date) : "Elige un día"}
          </h4>
          <div className="pr-2 space-y-4">{renderTimeSlots()}</div>
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
