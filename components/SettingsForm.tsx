"use client";

import { User } from "@prisma/client";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { updateUserProfile } from "@/actions/dashboard.actions";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Clipboard, Check, Save, Loader2Icon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="flex items-center justify-center w-auto"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2Icon className="w-4 h-4 animate-spin" />
          <span>Guardando...</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          <span>Guardar cambios</span>
        </>
      )}
    </Button>
  );
}

export default function SettingsForm({ user }: { user: User }) {
  const [state, formAction] = useFormState(updateUserProfile, null);
  const [slugValue, setSlugValue] = useState(user.slug || "");
  const [isCopied, setIsCopied] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { update } = useSession();

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Perfil Actualizado!", {
        description: state.success,
      });

      const dataToUpdate: { image?: string | null; slug?: string | null } = {};
      if (state.newImageUrl) {
        dataToUpdate.image = state.newImageUrl;
      }
      if (state.newSlug) {
        dataToUpdate.slug = state.newSlug;
      }

      update(dataToUpdate);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <form
        action={formAction}
        className="flex flex-col items-center justify-center max-w-lg mx-auto space-y-4"
      >
        <div className="flex items-center w-full gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage
              src={avatarPreview || user.image || ""}
              alt="Avatar del usuario"
            />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="picture">Foto de Perfil</Label>
            <Input
              id="picture"
              name="avatar"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              className="file:text-primary file:font-semibold"
            />
          </div>
        </div>
        <div className="grid w-full gap-2">
          <Label htmlFor="barbershopName">Nombre de tu Barbería</Label>
          <Input
            id="barbershopName"
            name="barbershopName"
            defaultValue={user.barbershopName || ""}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="slug">Tu URL Personalizada</Label>
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
              readOnly={!!user.slug}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="px-12 border-l-0 rounded-l-none"
              aria-label="Copiar URL"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" /> Copiado!
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" /> Copiar
                </>
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>
              Te recomendamos usar <strong>minúsculas</strong> y separar las
              palabras con un
              <strong> guion medio (-)</strong>. Ej:{" "}
              <strong>la-cueva-del-barbero</strong>
            </p>
          </div>
        </div>
        <SubmitButton />
      </form>
    </TooltipProvider>
  );
}
