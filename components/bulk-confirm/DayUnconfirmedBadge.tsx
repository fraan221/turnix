"use client";

import { memo, type MouseEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { useBulkSelectionStore } from "@/lib/stores/bulk-selection-store";

interface DayUnconfirmedBadgeProps {
  date: string;
  count: number;
}

export const DayUnconfirmedBadge = memo(function DayUnconfirmedBadge({
  date,
  count,
}: DayUnconfirmedBadgeProps) {
  const enterSelectionModeForDate = useBulkSelectionStore(
    (state) => state.enterSelectionModeForDate,
  );

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    enterSelectionModeForDate(date);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex"
      aria-label={`${count} turnos pendientes de confirmación`}
      title={`${count} turnos pendientes`}
    >
      <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1">
        {count}
      </Badge>
    </button>
  );
});
