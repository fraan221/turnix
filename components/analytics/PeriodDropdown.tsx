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

import { useRouter, useSearchParams } from "next/navigation";

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

export function RoutePeriodSelector({ baseUrl }: { baseUrl: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get("period") as Period) || "week";

  const handlePeriodChange = (newPeriod: Period) => {
    router.push(`${baseUrl}?period=${newPeriod}`);
  };

  return (
    <PeriodDropdown
      currentPeriod={currentPeriod}
      onPeriodChange={handlePeriodChange}
    />
  );
}
