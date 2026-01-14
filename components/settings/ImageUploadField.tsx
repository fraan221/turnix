"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ImageUploadFieldProps {
  id: string;
  name: string;
  label: string;
  preview: string | null;
  fallbackSrc: string;
  altText: string;
  onFileSelect: (file: File, dataUrl: string) => void;
  helpText?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export function ImageUploadField({
  id,
  name,
  label,
  preview,
  fallbackSrc,
  altText,
  onFileSelect,
  helpText = "JPG o PNG. Máximo 4MB",
  disabled = false,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error("Imagen demasiado grande", {
        description: `El archivo no puede superar los ${MAX_FILE_SIZE_MB}MB`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato no válido", {
        description: "Usá una imagen JPG o PNG",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onFileSelect(file, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="overflow-hidden relative w-20 h-20 rounded-full ring-2 shrink-0 ring-border">
        <Image
          src={preview || fallbackSrc}
          alt={altText}
          fill
          sizes="80px"
          className="object-cover"
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="flex absolute inset-0 justify-center items-center opacity-0 transition-opacity bg-black/50 hover:opacity-100 disabled:cursor-not-allowed"
        >
          <Camera className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id={id}
          name={name}
          type="file"
          accept="image/png, image/jpeg"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={disabled}
          className="file:font-medium file:text-primary"
        />
        <p className="text-xs text-muted-foreground">{helpText}</p>
      </div>
    </div>
  );
}
