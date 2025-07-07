"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 60) {
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        slots.push(`${hour}:${minute}`);
      }
    }
    return slots;
  }, []);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[120px]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder="Seleccionar..." />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {timeSlots.map(slot => (
            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
