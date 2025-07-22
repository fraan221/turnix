"use client";

import { User } from "@prisma/client";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { updateUserProfile } from "@/actions/dashboard.actions";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Clipboard, Check, Save, Loader2Icon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type UserWithBarbershop = User & {
  ownedBarbershop: { name: string; slug: string } | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="flex items-center justify-center w-full mt-4"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
          <span>Guardando...</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          <span>Guardar cambios</span>
        </>
      )}
    </Button>
  );
}

export default function SettingsForm({ user }: { user: UserWithBarbershop }) {
  const router = useRouter();
  const { update } = useSession();
  const [state, formAction] = useFormState(updateUserProfile, null);
  const [slugValue, setSlugValue] = useState(user.ownedBarbershop?.slug || "");
  const [isCopied, setIsCopied] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const stateRef = useRef(state);

  useEffect(() => {
    if (state !== stateRef.current) {
      stateRef.current = state;

      if (state?.success) {
        toast.success("¡Perfil Actualizado!", {
          description: state.success,
        });

        const sessionUpdateData: {
          name?: string | null;
          image?: string | null;
          slug?: string | null;
        } = {};
        if (state.newName) sessionUpdateData.name = state.newName;
        if (state.newImageUrl) sessionUpdateData.image = state.newImageUrl;
        if (state.newSlug) sessionUpdateData.slug = state.newSlug;

        update(sessionUpdateData).then(() => {
          router.refresh();
        });
      }

      if (state?.error) {
        toast.error("Error al guardar", {
          description: state.error,
        });
      }
    }
  }, [state, update, router]);

  const handleCopy = () => {
    if (!slugValue) return;
    const fullUrl = `https://turnix.app/${slugValue}`;
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
        className="flex flex-col items-center justify-center max-w-lg mx-auto space-y-6"
      >
        <div className="flex items-center w-full gap-4 p-4 border rounded-lg bg-card">
          <Avatar className="w-20 h-20">
            <AvatarImage
              src={avatarPreview || user.image || ""}
              alt="Avatar del usuario"
            />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid items-center flex-1 w-full gap-1.5">
            <Label htmlFor="picture">Foto de Perfil / Logo</Label>
            <Input
              id="picture"
              name="avatar"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
              className="file:text-primary file:font-semibold"
            />
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="grid w-full gap-2">
            <Label htmlFor="name">Tu Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user.name || ""}
              required
            />
          </div>
          <div className="grid w-full gap-2">
            <Label htmlFor="barbershopName">Nombre de tu Barbería</Label>
            <Input
              id="barbershopName"
              name="barbershopName"
              defaultValue={user.ownedBarbershop?.name || ""}
              required
            />
          </div>
          <div className="grid w-full gap-2">
            <Label htmlFor="slug">Tu URL Personalizada</Label>
            <div className="flex items-center">
              <span className="inline-flex items-center h-10 px-3 text-sm border border-r-0 rounded-l-md bg-muted text-muted-foreground">
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
                    onClick={handleCopy}
                    className="border-l-0 rounded-l-none w-28"
                    aria-label="Copiar URL"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clipboard className="w-4 h-4" />
                    )}
                    <span className="ml-2">
                      {isCopied ? "Copiado" : "Copiar"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copiar URL al portapapeles</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>
                Usa <strong>minúsculas</strong> y separa las palabras con un{" "}
                <strong>guion (-)</strong>. Ej:{" "}
                <strong>la-cueva-del-barbero</strong>
              </p>
            </div>
          </div>
        </div>
        <SubmitButton />
      </form>
    </TooltipProvider>
  );
}
