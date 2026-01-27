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
  imagePreview: string | null;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageSelect: (file: File, dataUrl: string) => void;
}

export function BarbershopInfoSection({
  name,
  address,
  description,
  imagePreview,
  onNameChange,
  onAddressChange,
  onDescriptionChange,
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
      </div>
    </SettingsCard>
  );
}
