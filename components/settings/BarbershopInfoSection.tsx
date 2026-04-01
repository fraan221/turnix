"use client";

import { Store } from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { ImageUploadField } from "./ImageUploadField";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BarbershopInfoSectionProps {
  name: string;
  address: string;
  description: string;
  cancellationPolicy: string;
  imagePreview: string | null;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancellationPolicyChange: (value: string) => void;
  onImageSelect: (file: File, dataUrl: string) => void;
}

export function BarbershopInfoSection({
  name,
  address,
  description,
  cancellationPolicy,
  imagePreview,
  onNameChange,
  onAddressChange,
  onDescriptionChange,
  onCancellationPolicyChange,
  onImageSelect,
}: BarbershopInfoSectionProps) {
  return (
    <SettingsCard
      icon={Store}
      title="Barbería"
      description="Datos públicos del negocio"
    >
      <div className="space-y-6">
        <ImageUploadField
          id="barbershopImage"
          name="barbershopImage"
          label="Logo"
          preview={imagePreview}
          fallbackSrc="/images/cta-background.jpg"
          altText={name || "Logo Barbería"}
          onFileSelect={onImageSelect}
        />

        <div className="space-y-2">
          <Label htmlFor="barbershopName" className="text-sm font-medium">
            Nombre
          </Label>
          <Input
            id="barbershopName"
            name="barbershopName"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ej: Barbería El Corte"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="barbershopAddress" className="text-sm font-medium">
            Dirección <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="barbershopAddress"
            name="barbershopAddress"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Ej: Av. Corrientes 1234, CABA"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="barbershopDescription"
            className="text-sm font-medium"
          >
            Descripción{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="barbershopDescription"
            name="barbershopDescription"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Descripción breve de tu negocio..."
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="cancellationPolicy"
            className="text-sm font-medium"
          >
            Política de Cancelación{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="cancellationPolicy"
            name="cancellationPolicy"
            value={cancellationPolicy}
            onChange={(e) => onCancellationPolicyChange(e.target.value)}
            placeholder="Ej: Las cancelaciones deben realizarse con al menos 24 horas de anticipación..."
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Este texto se mostrará a los clientes antes de confirmar su turno.
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
