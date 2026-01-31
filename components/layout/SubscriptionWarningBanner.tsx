"use client";

import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AlertTriangle, ExternalLink, Info } from "lucide-react";

const PENDING_GRACE_DAYS = 3;

export function SubscriptionWarningBanner() {
  const { status, pendingSince } = useSubscriptionStore();

  if (status !== "pending" || !pendingSince) {
    return null;
  }

  const graceEnd = new Date(pendingSince);
  graceEnd.setDate(graceEnd.getDate() + PENDING_GRACE_DAYS);
  const daysRemaining = Math.max(
    0,
    Math.ceil((graceEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  if (daysRemaining <= 0) {
    return null;
  }

  return (
    <Alert className="flex gap-3 justify-between items-center px-4 py-3 bg-amber-50 rounded-none border-t-0 border-amber-500 border-x-0 dark:bg-amber-950/20">
      <div className="flex gap-2 items-center text-sm text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium">Pago pendiente</span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex text-amber-600 hover:text-amber-800"
              aria-label="Más información"
            >
              <Info className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" className="w-64 text-sm">
            <p>
              Tu último pago falló. Tenés {daysRemaining} día
              {daysRemaining !== 1 ? "s" : ""} para actualizar tu método de pago
              antes de perder acceso.
            </p>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 p-0 h-auto text-sm text-amber-700 shrink-0 hover:bg-transparent hover:text-amber-900 hover:underline dark:text-amber-400"
        asChild
      >
        <a
          href="https://www.mercadopago.com.ar/subscriptions"
          target="_blank"
          rel="noopener noreferrer"
        >
          Actualizar pago
          <ExternalLink className="ml-1 w-3 h-3" />
        </a>
      </Button>
    </Alert>
  );
}
