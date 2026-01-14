"use client";

import { CreditCard, Receipt, Wallet } from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { Label } from "@/components/ui/label";

export function PaymentsSection() {
  return (
    <SettingsCard
      icon={CreditCard}
      title="Pagos"
      description="Gestioná tus métodos de pago y facturación"
      disabled
      badge="Próximamente"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Historial de facturación
            </Label>
          </div>
          <div className="p-4 rounded-md border border-muted bg-muted/30">
            <p className="text-sm text-center text-muted-foreground">
              No hay facturas disponibles
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Métodos de pago vinculados
            </Label>
          </div>
          <div className="p-4 rounded-md border border-muted bg-muted/30">
            <div className="flex gap-2 justify-center items-center">
              <div className="w-12 h-8 rounded bg-muted" />
              <p className="text-sm text-muted-foreground">
                Vinculá tu cuenta de Mercado Pago
              </p>
            </div>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
