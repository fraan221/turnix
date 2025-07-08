"use client";

import { User } from "@prisma/client";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { updateUserProfile } from "@/actions/dashboard.actions";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Copy, Check, HelpCircle } from "lucide-react"; 
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Guardando..." : "Guardar Cambios"}
    </Button>
  );
}

export default function SettingsForm({ user }: { user: User }) {
  const [state, formAction] = useFormState(updateUserProfile, null);
  const [slugValue, setSlugValue] = useState(user.slug || "");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Perfil Actualizado!", {
        description: state.success,
      });
    }
    if (state?.error) {
      toast.error("Error al guardar", {
        description: state.error,
      });
    }
  }, [state]);

  const handleCopy = () => {
    const fullUrl = `turnix.app/${slugValue}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("¡URL copiada al portapapeles!");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <form action={formAction} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Tu Nombre</Label>
          <Input id="name" name="name" defaultValue={user.name || ""} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="barbershopName">Nombre de tu Barbería (Opcional)</Label>
          <Input id="barbershopName" name="barbershopName" defaultValue={user.barbershopName || ""} />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="slug">Tu URL Personalizada</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-help">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-center" side="top">
                <p>Te recomendamos usar minúsculas y separar las palabras con un guion. <br /> Ej: <strong>la-cueva-del-barbero</strong></p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center h-10 px-3 text-sm text-gray-500 border border-r-0 border-input bg-muted rounded-l-md">
              turnix.app/
            </span>
            <Input
              id="slug"
              name="slug"
              value={slugValue}
              onChange={(e) => setSlugValue(e.target.value)}
              className="rounded-none focus-visible:ring-ring focus-visible:ring-offset-0"
              required
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="border-l-0 rounded-l-none"
                  aria-label="Copiar URL"
                >
                  {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Copiar al portapapeles</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <SubmitButton />
      </form>
    </TooltipProvider>
  );
}