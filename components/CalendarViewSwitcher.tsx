"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type CalendarView = "timeGridDay" | "timeGridWeek" | "dayGridMonth";

interface CalendarViewSwitcherProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

const viewLabels: Record<CalendarView, string> = {
  timeGridDay: "Día",
  timeGridWeek: "Semana",
  dayGridMonth: "Mes",
};

export function CalendarViewSwitcher({
  currentView,
  onViewChange,
}: CalendarViewSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {viewLabels[currentView]}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewChange("timeGridDay")}>
          Día
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewChange("timeGridWeek")}>
          Semana
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewChange("dayGridMonth")}>
          Mes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}