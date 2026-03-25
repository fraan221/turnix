"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBulkSelectionStore,
  selectIsSelectionMode,
  selectSelectedCount,
  selectSelectedBookingIds,
} from "@/lib/stores/bulk-selection-store";
import { bulkUpdateBookingStatus } from "@/actions/dashboard.actions";
import { BookingStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface BulkConfirmFABProps {
  dayUnconfirmedIds: string[];
}

export function BulkConfirmFAB({ dayUnconfirmedIds }: BulkConfirmFABProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isSelectionMode = useBulkSelectionStore(selectIsSelectionMode);
  const selectedCount = useBulkSelectionStore(selectSelectedCount);
  const selectedBookingIds = useBulkSelectionStore(selectSelectedBookingIds);
  const exitSelectionMode = useBulkSelectionStore((s) => s.exitSelectionMode);
  const selectAll = useBulkSelectionStore((s) => s.selectAll);

  if (!isSelectionMode) {
    return null;
  }

  const handleConfirm = () => {
    if (selectedCount === 0) {
      toast.error("Seleccioná al menos un turno para confirmar.");
      return;
    }

    startTransition(async () => {
      const result = await bulkUpdateBookingStatus(
        Array.from(selectedBookingIds),
        BookingStatus.COMPLETED,
      );

      if ("success" in result) {
        toast.success(result.success);
        exitSelectionMode();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleSelectAll = () => {
    selectAll(dayUnconfirmedIds);
  };

  // Selection mode - show action bar
  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 left-4 z-50",
        "md:right-6 md:bottom-6 md:left-auto",
        "flex flex-col gap-2 p-3 rounded-lg border bg-background shadow-xl",
        "md:flex-row md:items-center md:gap-3",
      )}
    >
      {/* Quick select buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={isPending}
        >
          Todos ({dayUnconfirmedIds.length})
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={exitSelectionMode}
          disabled={isPending}
        >
          <X className="mr-1 size-4" />
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={isPending || selectedCount === 0}
          className="min-w-[140px]"
        >
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <CheckCheck className="mr-2 size-4" />
          )}
          Confirmar ({selectedCount})
        </Button>
      </div>
    </div>
  );
}
