"use client";

import * as React from "react";
import { Period } from "@/actions/analytics.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useRouter, useSearchParams } from "next/navigation";

interface PeriodDropdownProps {
  currentPeriod: Period;
  onPeriodChange: (period: Period) => void;
  customDate?: string;
  onCustomDateChange?: (date: string) => void;
}

export const periodsConfig: { value: Period; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mes" },
  { value: "lastMonth", label: "Mes Pasado" },
  { value: "all", label: "Todo el tiempo" },
  { value: "custom", label: "Elegir día" },
];

function CustomDatePicker({
  customDate,
  onCustomDateChange,
  formatCustomDateLabel,
}: {
  customDate?: string;
  onCustomDateChange?: (date: string) => void;
  formatCustomDateLabel: (dateStr?: string) => string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
        >
          <CalendarIcon className="size-4 text-muted-foreground" data-icon="inline-start" />
          <span>
            {customDate ? formatCustomDateLabel(customDate) : "Seleccionar fecha"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={customDate ? new Date(customDate + "T12:00:00") : undefined}
          onSelect={(date) => {
            if (date) {
              const formatted = format(date, "yyyy-MM-dd");
              onCustomDateChange?.(formatted);
              setIsOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function PeriodDropdown({
  currentPeriod,
  onPeriodChange,
  customDate,
  onCustomDateChange,
}: PeriodDropdownProps) {
  const formatCustomDateLabel = (dateStr?: string) => {
    if (!dateStr) return "Seleccionar fecha";
    try {
      const date = new Date(dateStr + "T12:00:00");
      return format(date, "d 'de' MMMM", { locale: es });
    } catch (e) {
      return "Seleccionar fecha";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentPeriod}
        onValueChange={(val) => {
          onPeriodChange(val as Period);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          {periodsConfig.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentPeriod === "custom" && (
        <CustomDatePicker
          customDate={customDate}
          onCustomDateChange={onCustomDateChange}
          formatCustomDateLabel={formatCustomDateLabel}
        />
      )}
    </div>
  );
}

export function RoutePeriodSelector({ baseUrl }: { baseUrl: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get("period") as Period) || "week";
  const customDate = searchParams.get("date") || undefined;

  const handlePeriodChange = (newPeriod: Period) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    params.delete("date");
    router.push(`${baseUrl}?${params.toString()}`);
  };

  const handleCustomDateChange = (date: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("date", date);
    router.push(`${baseUrl}?${params.toString()}`);
  };

  return (
    <PeriodDropdown
      currentPeriod={currentPeriod}
      onPeriodChange={handlePeriodChange}
      customDate={customDate}
      onCustomDateChange={handleCustomDateChange}
    />
  );
}
