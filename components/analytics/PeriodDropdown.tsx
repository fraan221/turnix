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

interface PeriodDropdownProps {
  currentPeriod: Period;
  onPeriodChange: (period: Period) => void;
}

export const periodsConfig: { value: Period; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mes" },
  { value: "quarter", label: "Últimos 3 Meses" },
  { value: "year", label: "Este Año" },
  { value: "all", label: "Todo el tiempo" },
];

export function PeriodDropdown({
  currentPeriod,
  onPeriodChange,
}: PeriodDropdownProps) {
  return (
    <Select
      value={currentPeriod}
      onValueChange={(val) => onPeriodChange(val as Period)}
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
  );
}
