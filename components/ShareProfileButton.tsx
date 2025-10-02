"use client";

import { useState } from "react";
import { Share2, Link, Check } from "lucide-react";
import { toast } from "sonner";

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

interface ShareProfileButtonProps {
  slug: string;
}

export function ShareProfileButton({ slug }: ShareProfileButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
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
            Este es el link que tus clientes usan para reservar turnos con vos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
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
          <div className="p-3 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> Poné
              este link en tu bio de Instagram, en tu estado de WhatsApp o
              enviáselo directo a tus clientes.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
