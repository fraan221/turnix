"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Unlink,
  DollarSign,
  Percent,
} from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  depositAmountType: "fixed" | "percentage";
  depositAmount: string;
  onDepositEnabledChange: (enabled: boolean) => void;
  onDepositAmountTypeChange: (type: "fixed" | "percentage") => void;
  onDepositAmountChange: (amount: string) => void;
}

export function PaymentsSection({
  initialMpConnected = false,
  depositEnabled,
  depositAmountType,
  depositAmount,
  onDepositEnabledChange,
  onDepositAmountTypeChange,
  onDepositAmountChange,
}: PaymentsSectionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isConnected, setIsConnected] = useState(initialMpConnected);
  const [isLoadingStatus, setIsLoadingStatus] = useState(!initialMpConnected);
  const toastShownRef = useRef(false);

  // For formatted display (with thousand separators)
  const [amountDisplay, setAmountDisplay] = useState(() => {
    if (depositAmount && depositAmountType === "fixed") {
      return formatPrice(depositAmount);
    }
    return depositAmount;
  });

  useEffect(() => {
    // Prevent duplicate toasts (especially in React Strict Mode)
    if (toastShownRef.current) return;

    const mpConnected = searchParams.get("mp_connected");
    const error = searchParams.get("error");

    if (mpConnected === "true") {
      setIsConnected(true);
      toast.success("¡Mercado Pago conectado!", {
        description: "Ya podés empezar a cobrar señas.",
      });
      toastShownRef.current = true;
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        csrf_mismatch: "Error de seguridad. Intentá de nuevo.",
        token_exchange_failed: "No se pudo conectar con Mercado Pago.",
        mp_access_denied: "Denegaste el acceso a Mercado Pago.",
        no_barbershop: "No tenés una barbería configurada.",
      };
      toast.error("Error al conectar Mercado Pago", {
        description: errorMessages[error] || error,
      });
      toastShownRef.current = true;
    }
  }, [searchParams]);

  useEffect(() => {
    if (initialMpConnected) return;

    async function loadStatus() {
      setIsLoadingStatus(true);
      const status = await getMercadoPagoStatus();
      setIsConnected(status.connected);
      setIsLoadingStatus(false);
    }

    loadStatus();
  }, [initialMpConnected]);

  const handleConnect = () => {
    window.location.href = "/api/mercadopago/oauth";
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectMercadoPago();
      if (result.success) {
        setIsConnected(false);
        onDepositEnabledChange(false);
        toast.success("Mercado Pago desconectado");

        // Clean URL params to prevent wrong toast on refresh
        router.replace("/dashboard/settings?section=payments");
        // Reset toast flag so it can show again if user reconnects
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

    if (depositAmountType === "fixed") {
      // Use formatted display for fixed amounts
      const formattedValue = formatPrice(inputValue);
      setAmountDisplay(formattedValue);
      const cleanValue = cleanPriceValue(formattedValue);
      onDepositAmountChange(cleanValue);
    } else {
      // For percentage, just use the raw value (limited to 100)
      const numValue = parseInt(inputValue) || 0;
      const clampedValue = Math.min(100, Math.max(0, numValue));
      setAmountDisplay(clampedValue.toString());
      onDepositAmountChange(clampedValue.toString());
    }
  };

  // Sync amountDisplay when type changes
  useEffect(() => {
    if (depositAmountType === "fixed" && depositAmount) {
      setAmountDisplay(formatPrice(depositAmount));
    } else {
      setAmountDisplay(depositAmount);
    }
  }, [depositAmountType, depositAmount]);

  return (
    <SettingsCard
      icon={CreditCard}
      title="Pagos"
      description="Configurá Mercado Pago para cobrar señas en las reservas"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Cuenta de Mercado Pago
            </Label>
          </div>

          {isLoadingStatus ? (
            <div className="flex justify-center items-center p-4 rounded-lg border border-muted bg-muted/30">
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          ) : isConnected ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 dark:border-green-900 dark:bg-green-950/30">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Conectado
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Los pagos irán directamente a tu cuenta
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Unlink className="mr-1 w-4 h-4" />
                      Desconectar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-muted bg-muted/30">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">No conectado</p>
                    <p className="text-xs text-muted-foreground">
                      Conectá tu cuenta para cobrar señas
                    </p>
                  </div>
                </div>
                <Button type="button" size="sm" onClick={handleConnect}>
                  Conectar
                  <ExternalLink className="ml-1 w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Requerir Seña</Label>
              <p className="text-xs text-muted-foreground">
                Los clientes deberán pagar una seña para confirmar su turno
              </p>
            </div>
            <Switch
              checked={depositEnabled}
              onCheckedChange={onDepositEnabledChange}
              disabled={!isConnected || isPending}
            />
          </div>

          {depositEnabled && (
            <div className="p-4 space-y-4 rounded-lg border border-muted bg-muted/10">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="depositType" className="text-sm">
                    Tipo de seña
                  </Label>
                  <Select
                    value={depositAmountType}
                    onValueChange={(v) =>
                      onDepositAmountTypeChange(v as "fixed" | "percentage")
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger id="depositType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">
                        <div className="flex gap-2 items-center">
                          <DollarSign className="w-4 h-4" />
                          Monto fijo
                        </div>
                      </SelectItem>
                      <SelectItem value="percentage">
                        <div className="flex gap-2 items-center">
                          <Percent className="w-4 h-4" />
                          Porcentaje
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount" className="text-sm">
                    {depositAmountType === "fixed"
                      ? "Monto ($)"
                      : "Porcentaje (%)"}
                  </Label>
                  <div className="relative">
                    {depositAmountType === "fixed" && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                    )}
                    <Input
                      id="depositAmount"
                      type="text"
                      inputMode="numeric"
                      placeholder={
                        depositAmountType === "fixed" ? "ej: 5.000" : "ej: 50"
                      }
                      value={amountDisplay}
                      onChange={handleAmountChange}
                      disabled={isPending}
                      className={depositAmountType === "fixed" ? "pl-7" : ""}
                    />
                    {depositAmountType === "percentage" && (
                      <span className="absolute right-3 top-1/2 text-xs -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
