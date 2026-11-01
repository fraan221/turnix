"use client";

import * as React from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMonthLabel, isMonthDisabled } from "@/lib/date-helpers";

export { formatMonthLabel, isMonthDisabled };

const MONTH_NAMES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export interface MonthPickerProps {
  customDate?: string;
  onCustomDateChange?: (date: string) => void;
  minYear?: number;
  maxYear?: number;
}

export function MonthPicker({
  customDate,
  onCustomDateChange,
  minYear = 2024,
  maxYear,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const now = new Date();
  const effectiveMaxYear = maxYear ?? now.getFullYear();

  const selectedYear = customDate
    ? parseInt(customDate.split("-")[0] || String(now.getFullYear()), 10)
    : now.getFullYear();

  const selectedMonthIndex = customDate
    ? parseInt(customDate.split("-")[1] || "0", 10) - 1
    : -1;

  const [viewYear, setViewYear] = React.useState<number>(selectedYear);

  React.useEffect(() => {
    if (customDate) {
      const parsedYear = parseInt(customDate.split("-")[0] || "", 10);
      if (!Number.isNaN(parsedYear)) {
        setViewYear(parsedYear);
      }
    }
  }, [customDate]);

  const handleSelectMonth = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, "0");
    const dateStr = `${viewYear}-${formattedMonth}-01`;
    onCustomDateChange?.(dateStr);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
        >
          <CalendarIcon className="size-4 text-muted-foreground" data-icon="inline-start" />
          <span>{formatMonthLabel(customDate)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        {/* Header with year and arrows */}
        <div className="flex items-center justify-between pb-3 border-b mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={viewYear <= minYear}
            onClick={() => setViewYear((prev) => prev - 1)}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Año anterior</span>
          </Button>
          <span className="text-sm font-semibold tracking-tight">{viewYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={viewYear >= effectiveMaxYear}
            onClick={() => setViewYear((prev) => prev + 1)}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Año siguiente</span>
          </Button>
        </div>

        {/* 3x4 Grid of months */}
        <div className="grid grid-cols-3 gap-2">
          {MONTH_NAMES.map((name, index) => {
            const isSelected = viewYear === selectedYear && index === selectedMonthIndex;
            const disabled = isMonthDisabled(viewYear, index, minYear, now);

            return (
              <Button
                key={name}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                disabled={disabled}
                onClick={() => handleSelectMonth(index)}
                className={cn(
                  "h-9 text-xs font-normal",
                  isSelected && "font-semibold shadow-sm",
                  disabled && "opacity-40 cursor-not-allowed"
                )}
              >
                {name}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
