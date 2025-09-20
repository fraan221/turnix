"use client";

import { Share2, Link } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBaseUrl } from "@/lib/get-base-url";

interface ShareProfileButtonProps {
  slug: string;
}

export function ShareProfileButton({ slug }: ShareProfileButtonProps) {
  const profileUrl = `${getBaseUrl()}/${slug}`;

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(profileUrl)
      .then(() => {
        toast.success("¡Copiado!", {
          description: "El link de tu perfil se copió al portapapeles.",
        });
      })
      .catch((err) => {
        console.error("Error al copiar al portapapeles:", err);
        toast.error("Error", {
          description: "No se pudo copiar el link.",
        });
      });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Share2 className="w-5 h-5" />
          <span className="sr-only">Compartir perfil</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Link className="w-4 h-4 mr-2" />
          Compartir Pagina Pública
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
