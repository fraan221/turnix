"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Unlink,
  ToggleLeft,
  ToggleRight,
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
  updateDepositSettings,
} from "@/actions/payment.actions";

interface DepositSettings {
  depositEnabled: boolean;
  depositAmountType: "fixed" | "percentage" | null;
  depositAmount: number | null;
  mpConnected: boolean;
}

interface PaymentsSectionProps {
  initialSettings?: DepositSettings;
}

export function PaymentsSection({ initialSettings }: PaymentsSectionProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Connection state
  const [isConnected, setIsConnected] = useState(
    initialSettings?.mpConnected ?? false,
  );
  const [isLoadingStatus, setIsLoadingStatus] = useState(!initialSettings);

  // Deposit settings state
  const [depositEnabled, setDepositEnabled] = useState(
    initialSettings?.depositEnabled ?? false,
  );
  const [depositType, setDepositType] = useState<"fixed" | "percentage">(
    (initialSettings?.depositAmountType as "fixed" | "percentage") ?? "fixed",
  );
  const [depositAmount, setDepositAmount] = useState<string>(
    initialSettings?.depositAmount?.toString() ?? "",
  );

  // Check for OAuth callback success/error
  useEffect(() => {
    const mpConnected = searchParams.get("mp_connected");
    const error = searchParams.get("error");

    if (mpConnected === "true") {
      setIsConnected(true);
      toast.success("¡Mercado Pago conectado!", {
        description: "Ya podés empezar a cobrar señas.",
      });
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
    }
  }, [searchParams]);

  // Load connection status if not provided
  useEffect(() => {
    if (initialSettings) return;

    async function loadStatus() {
      setIsLoadingStatus(true);
      const status = await getMercadoPagoStatus();
      setIsConnected(status.connected);
      setIsLoadingStatus(false);
    }

    loadStatus();
  }, [initialSettings]);

  const handleConnect = () => {
    // Redirect to OAuth initiation endpoint
    window.location.href = "/api/mercadopago/oauth";
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectMercadoPago();
      if (result.success) {
        setIsConnected(false);
        setDepositEnabled(false);
        toast.success("Mercado Pago desconectado");
      } else {
        toast.error("Error al desconectar", {
          description: result.error,
        });
      }
    });
  };

  const handleSaveSettings = () => {
    const amount = parseFloat(depositAmount);

    if (depositEnabled && (!amount || amount <= 0)) {
      toast.error("Ingresá un monto válido para la seña");
      return;
    }

    if (depositEnabled && depositType === "percentage" && amount > 100) {
      toast.error("El porcentaje no puede ser mayor a 100%");
      return;
    }

    startTransition(async () => {
      const result = await updateDepositSettings({
        depositEnabled,
        depositAmountType: depositEnabled ? depositType : null,
        depositAmount: depositEnabled ? amount : null,
      });

      if (result.success) {
        toast.success("Configuración guardada");
      } else {
        toast.error("Error al guardar", {
          description: result.error,
        });
      }
    });
  };

  return (
    <SettingsCard
      icon={CreditCard}
      title="Pagos y Señas"
      description="Configurá Mercado Pago para cobrar señas en las reservas"
    >
      <div className="space-y-6">
        {/* Mercado Pago Connection */}
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Cuenta de Mercado Pago
            </Label>
          </div>

          {isLoadingStatus ? (
            <div className="flex items-center justify-center p-4 rounded-lg border border-muted bg-muted/30">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          ) : isConnected ? (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                      <Unlink className="w-4 h-4 mr-1" />
                      Desconectar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-muted bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">No conectado</p>
                    <p className="text-xs text-muted-foreground">
                      Conectá tu cuenta para cobrar señas
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={handleConnect}>
                  Conectar
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Deposit Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Requerir Seña</Label>
              <p className="text-xs text-muted-foreground">
                Los clientes deberán pagar una seña para confirmar su turno
              </p>
            </div>
            <Switch
              checked={depositEnabled}
              onCheckedChange={setDepositEnabled}
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
                    value={depositType}
                    onValueChange={(v) =>
                      setDepositType(v as "fixed" | "percentage")
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger id="depositType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Monto fijo
                        </div>
                      </SelectItem>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4" />
                          Porcentaje
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount" className="text-sm">
                    {depositType === "fixed" ? "Monto ($)" : "Porcentaje (%)"}
                  </Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="0"
                    max={depositType === "percentage" ? "100" : undefined}
                    step={depositType === "percentage" ? "1" : "100"}
                    placeholder={
                      depositType === "fixed" ? "ej: 2000" : "ej: 50"
                    }
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isPending || !depositAmount}
                className="w-full sm:w-auto"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar configuración"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
