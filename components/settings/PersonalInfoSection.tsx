"use client";

import { User as UserIcon } from "lucide-react";
import { SettingsCard } from "./SettingsCard";
import { ImageUploadField } from "./ImageUploadField";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PersonalInfoSectionProps {
  name: string;
  phone: string;
  avatarPreview: string | null;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAvatarSelect: (file: File, dataUrl: string) => void;
}

export function PersonalInfoSection({
  name,
  phone,
  avatarPreview,
  onNameChange,
  onPhoneChange,
  onAvatarSelect,
}: PersonalInfoSectionProps) {
  return (
    <SettingsCard
      icon={UserIcon}
      title="Información personal"
      description="Tu nombre y foto de perfil"
    >
      <div className="space-y-6">
        <ImageUploadField
          id="avatar"
          name="avatar"
          label="Foto de perfil"
          preview={avatarPreview}
          fallbackSrc="/images/hero-background.jpg"
          altText={name || "Avatar"}
          onFileSelect={onAvatarSelect}
        />

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nombre completo
          </Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Tu nombre"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Número de celular{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="Ej: +54 9 11 1234-5678"
          />
        </div>
      </div>
    </SettingsCard>
  );
}
