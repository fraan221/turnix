"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Unlink,
} from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  getMercadoPagoStatus,
  disconnectMercadoPago,
} from "@/actions/payment.actions";
import { formatPrice, cleanPriceValue } from "@/lib/format";

export interface DepositSettings {
  depositEnabled: boolean;
  depositAmountType: "fixed" | "percentage";
  depositAmount: string;
}

interface PaymentsSectionProps {
  initialMpConnected?: boolean;
  depositEnabled: boolean;
  depositAmount: string;
  onDepositEnabledChange: (enabled: boolean) => void;
  onDepositAmountChange: (amount: string) => void;
}

export function PaymentsSection({
  initialMpConnected = false,
  depositEnabled,
  depositAmount,
  onDepositEnabledChange,
  onDepositAmountChange,
}: PaymentsSectionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isConnected, setIsConnected] = useState(initialMpConnected);
  const [isLoadingStatus, setIsLoadingStatus] = useState(!initialMpConnected);
  const [isConnecting, setIsConnecting] = useState(false);
  const toastShownRef = useRef(false);

  const [amountDisplay, setAmountDisplay] = useState(() => {
    return formatPrice(depositAmount);
  });

  // ... (useEffect for searchParams remains same)

  // ... (useEffect for initialMpConnected remains same)

  // ... (useEffect for initialMpConnected remains same)

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = "/api/mercadopago/oauth";
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectMercadoPago();
      if (result.success) {
        setIsConnected(false);
        onDepositEnabledChange(false);
        toast.success("Mercado Pago desconectado");

        router.replace("/dashboard/settings?section=payments");
        toastShownRef.current = false;
      } else {
        toast.error("Error al desconectar", {
          description: result.error,
        });
      }
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatPrice(inputValue);
    setAmountDisplay(formattedValue);
    const cleanValue = cleanPriceValue(formattedValue);
    onDepositAmountChange(cleanValue);
  };

  useEffect(() => {
    setAmountDisplay(formatPrice(depositAmount));
  }, [depositAmount]);

  return (
    <SettingsCard
      icon={CreditCard}
      title="Pagos"
      description="Gestioná tus cobros y señas"
    >
      <div className="space-y-6">
        {isLoadingStatus ? (
          <div className="flex flex-col gap-4 justify-center items-center p-6 rounded-lg border border-muted bg-muted/20">
            <Image
              src="/images/mercadopago-logo.png"
              alt="Mercado Pago"
              width={160}
              height={50}
              priority
              className="object-contain w-auto h-8 opacity-50"
            />
            <div className="flex gap-2 items-center text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Verificando...</span>
            </div>
          </div>
        ) : isConnected ? (
          <div className="p-5 space-y-4 rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <Image
                src="/images/mercadopago-logo.png"
                alt="Mercado Pago"
                width={140}
                height={45}
                priority
                className="object-contain w-auto h-10"
              />
              <div className="flex gap-1.5 items-center text-green-600 dark:text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Conectado</span>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Las señas se acreditan en tu cuenta de Mercado Pago.
            </p>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={isPending}
              className="p-0 w-full h-auto text-xs text-muted-foreground hover:text-destructive hover:bg-transparent"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Desvinculando...
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4" />
                  Desvincular cuenta
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="p-5 space-y-4 text-center rounded-lg border border-dashed border-muted bg-muted/10">
            <Image
              src="/images/mercadopago-logo.png"
              alt="Mercado Pago"
              width={160}
              height={50}
              priority
              className="object-contain mx-auto w-auto h-12"
            />

            <div className="space-y-1">
              <p className="text-sm font-medium">Cobrá señas de forma segura</p>
              <p className="text-xs text-muted-foreground">
                El dinero va directo a tu cuenta.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full text-white bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando Mercado Pago...
                </>
              ) : (
                <>
                  Conectar Mercado Pago
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {isConnected && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Señas</Label>
                </div>
                <Switch
                  checked={depositEnabled}
                  onCheckedChange={onDepositEnabledChange}
                  disabled={!isConnected || isPending}
                />
              </div>

              {depositEnabled && (
                <div className="p-4 rounded-lg border border-muted bg-muted/10">
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount" className="text-sm">
                      Monto de la seña ($)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="depositAmount"
                        type="text"
                        inputMode="numeric"
                        placeholder="ej: 5.000"
                        value={amountDisplay}
                        onChange={handleAmountChange}
                        disabled={isPending}
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SettingsCard>
  );
}
