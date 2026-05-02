"use client";

import { useState, useTransition } from "react";
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
import { BulkPaymentSheet } from "./BulkPaymentSheet";

interface BulkConfirmFABProps {
  dayUnconfirmedIds: string[];
}

export function BulkConfirmFAB({ dayUnconfirmedIds }: BulkConfirmFABProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  const isSelectionMode = useBulkSelectionStore(selectIsSelectionMode);
  const selectedCount = useBulkSelectionStore(selectSelectedCount);
  const selectedBookingIds = useBulkSelectionStore(selectSelectedBookingIds);
  const exitSelectionMode = useBulkSelectionStore((s) => s.exitSelectionMode);
  const selectAll = useBulkSelectionStore((s) => s.selectAll);

  if (!isSelectionMode && !showPaymentSheet) {
    return null;
  }

  const handleConfirm = () => {
    if (selectedCount === 0) {
      toast.error("Seleccioná al menos un turno para confirmar.");
      return;
    }

    startTransition(async () => {
      const idsArray = Array.from(selectedBookingIds);
      const result = await bulkUpdateBookingStatus(
        idsArray,
        BookingStatus.COMPLETED,
      );

      if ("success" in result) {
        setConfirmedIds(idsArray);
        toast.success(result.success, {
          action: {
            label: "Asignar método de pago",
            onClick: () => setShowPaymentSheet(true),
          },
          duration: 8000,
        });
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

  return (
    <>
      {isSelectionMode && (
        <div
          className={cn(
            "fixed right-4 bottom-4 left-4 z-50",
            "md:right-6 md:bottom-6 md:left-auto",
            "flex flex-col gap-2 p-3 rounded-lg border shadow-xl bg-background",
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
                <Loader2 className="mr-1 animate-spin size-4" />
              ) : (
                <CheckCheck className="mr-1 size-4" />
              )}
              Confirmar ({selectedCount})
            </Button>
          </div>
        </div>
      )}

      <BulkPaymentSheet
        open={showPaymentSheet}
        onOpenChange={setShowPaymentSheet}
        bookingIds={confirmedIds}
      />
    </>
  );
}
