"use client";

import { Shield, KeyRound, Smartphone } from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function SecuritySection() {
  return (
    <SettingsCard
      icon={Shield}
      title="Seguridad"
      description="Protegé tu cuenta con opciones avanzadas"
      disabled
      badge="Próximamente"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Cambio de contraseña</Label>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            disabled
            className="bg-muted/30"
          />
          <p className="text-xs text-muted-foreground">
            Actualizá tu contraseña periódicamente para mayor seguridad
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Autenticación de dos factores (2FA)
            </Label>
          </div>
          <div className="flex justify-between items-center p-3 rounded-md border border-muted bg-muted/30">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                No configurado
              </p>
              <p className="text-xs text-muted-foreground">
                Agregá una capa extra de seguridad a tu cuenta
              </p>
            </div>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
