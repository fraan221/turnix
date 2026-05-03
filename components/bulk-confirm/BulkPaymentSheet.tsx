"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Banknote, Smartphone, CreditCard } from "lucide-react";
import { PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { bulkSetPaymentMethod } from "@/actions/dashboard.actions";

interface BulkPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingIds: string[];
}

export function BulkPaymentSheet({
  open,
  onOpenChange,
  bookingIds,
}: BulkPaymentSheetProps) {
  const [isPending, startTransition] = useTransition();

  const handleSetPaymentMethod = (method: PaymentMethod) => {
    startTransition(async () => {
      const result = await bulkSetPaymentMethod(bookingIds, method);
      if (result.success) {
        toast.success(result.success);
        onOpenChange(false);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-6 rounded-t-2xl border-t-0 sm:max-w-md sm:mx-auto sm:side-bottom sm:rounded-2xl sm:mb-8"
      >
        <SheetHeader className="mb-6 text-center sm:text-center">
          <SheetTitle>Asignar método de pago</SheetTitle>
          <SheetDescription>
            Seleccioná cómo se cobraron estos {bookingIds.length} turnos.
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            className="justify-start px-6 h-16 text-lg text-green-700 bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/50"
            onClick={() => handleSetPaymentMethod("CASH")}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-4 animate-spin" />
            ) : (
              <Banknote className="mr-4 w-6 h-6" />
            )}
            Efectivo
          </Button>
          <Button
            variant="outline"
            className="justify-start px-6 h-16 text-lg text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50"
            onClick={() => handleSetPaymentMethod("TRANSFER")}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-4 animate-spin" />
            ) : (
              <Smartphone className="mr-4 w-6 h-6" />
            )}
            Transferencia / MP
          </Button>
          <Button
            variant="outline"
            className="justify-start px-6 h-16 text-lg text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/50"
            onClick={() => handleSetPaymentMethod("CARD")}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-4 animate-spin" />
            ) : (
              <CreditCard className="mr-4 w-6 h-6" />
            )}
            Tarjeta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
