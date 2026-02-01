"use client";

import { useState, useRef } from "react";
import { Share2, Link, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getBaseUrl } from "@/lib/get-base-url";
import { Separator } from "@/components/ui/separator";

interface ShareProfileButtonProps {
  slug: string;
  logoUrl: string | null;
}

export function ShareProfileButton({ slug, logoUrl }: ShareProfileButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const profileUrl = `${getBaseUrl()}/${slug}`;

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(profileUrl)
      .then(() => {
        setIsCopied(true);
        toast.success("Link copiado", {
          description: "Ya podés pegarlo donde quieras",
        });
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Error al copiar:", err);
        toast.error("No se pudo copiar", {
          description: "Intentá seleccionar y copiar manualmente",
        });
      });
  };

  const downloadQRCode = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector("canvas");
      if (canvas) {
        const pngUrl = canvas
          .toDataURL("image/png")
          .replace("image/png", "image/octet-stream");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${slug}-qr-code.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success("QR Descargado", {
          description: "La imagen se guardó en tu dispositivo.",
        });
      }
    }
  };

  const imageSettings = logoUrl
    ? {
        src: logoUrl,
        height: 40,
        width: 40,
        excavate: true,
        crossOrigin: "anonymous" as const,
      }
    : undefined;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Share2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartí tu perfil público</DialogTitle>
          <DialogDescription>
            Tus clientes pueden escanear el QR o usar el link para reservar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-center">
            <Input
              readOnly
              value={profileUrl}
              className="flex-1"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button size="sm" onClick={copyToClipboard} className="shrink-0">
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col gap-4 items-center">
            <div
              ref={qrCodeRef}
              className="p-4 bg-white rounded-lg border shadow-sm"
            >
              <QRCodeCanvas
                value={profileUrl}
                size={220}
                level={"H"}
                includeMargin={true}
                imageSettings={imageSettings}
              />
            </div>
            <Button onClick={downloadQRCode} className="w-full">
              <Download className="mr-2 w-4 h-4" />
              Descargar QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
