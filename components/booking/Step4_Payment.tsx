"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { createDepositPreference } from "@/actions/payment.actions";
import { ArrowLeft, Loader2, CreditCard, ExternalLink } from "lucide-react";

interface Step4PaymentProps {
  bookingId: string;
  depositAmount: number;
  serviceName: string;
  barbershopName: string;
  onBack: () => void;
}

export function Step4_Payment({
  bookingId,
  depositAmount,
  serviceName,
  barbershopName,
  onBack,
}: Step4PaymentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initPoint, setInitPoint] = useState<string | null>(null);

  // Generate payment preference on mount
  useEffect(() => {
    async function createPreference() {
      setIsLoading(true);
      setError(null);

      const result = await createDepositPreference(bookingId);

      if (result.success && result.initPoint) {
        setInitPoint(result.initPoint);
      } else {
        setError(result.error || "Error al generar el pago");
      }

      setIsLoading(false);
    }

    createPreference();
  }, [bookingId]);

  const handlePayment = () => {
    if (initPoint) {
      // Redirect to Mercado Pago Checkout
      window.location.href = initPoint;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Paso 4: Pago de Seña</h3>
        <p className="text-muted-foreground">
          Para confirmar tu turno, necesitamos que abones una seña.
        </p>
      </div>

      <div className="p-4 space-y-4 border rounded-lg">
        <div>
          <h3 className="mb-2 font-semibold">Resumen</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Servicio</span>
              <span>{serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span>Barbería</span>
              <span>{barbershopName}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Seña a pagar</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(depositAmount)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Este monto se descontará del total al momento de tu turno.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 rounded-lg bg-red-50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <Button
          onClick={handlePayment}
          disabled={isLoading || !initPoint}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Preparando pago...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pagar con Mercado Pago
              <ExternalLink className="w-3 h-3 ml-2" />
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Serás redirigido a Mercado Pago para completar el pago de forma segura.
      </p>
    </div>
  );
}
