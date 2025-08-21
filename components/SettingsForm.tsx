"use client";

import { User } from "@prisma/client";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { type FormState, updateUserProfile } from "@/actions/dashboard.actions";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useEffect, useState, useRef, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Clipboard, Check, Save, Loader2Icon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { AvatarCropper } from "./AvatarCropper";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full mt-4" disabled={pending}>
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

interface SettingsFormProps {
  user: User & {
    barbershop: {
      name: string;
      slug: string;
    } | null;
  };
}

const initialState: FormState = { success: null, error: null };

export default function SettingsForm({ user }: SettingsFormProps) {
  const [state, formAction] = useFormState(updateUserProfile, initialState);
  const { data: session, update } = useSession();
  const [slugValue, setSlugValue] = useState(user.barbershop?.slug || "");
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const croppedImageRef = useRef<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
  const formStateRef = useRef<FormState>(initialState);
  const router = useRouter();

  useEffect(() => {
    const handleStateChange = async () => {
      if (state !== formStateRef.current) {
        formStateRef.current = state;

        if (state.success) {
          toast.success("¡Perfil Actualizado!", {
            description: state.success,
          });

          const dataToUpdate: any = {};
          if (state.newImageUrl) dataToUpdate.image = state.newImageUrl;
          if (state.newName) dataToUpdate.name = state.newName;
          if (state.newSlug)
            dataToUpdate.barbershop = {
              ...session?.user.barbershop,
              slug: state.newSlug,
            };

          if (Object.keys(dataToUpdate).length > 0) {
            await update(dataToUpdate);
            router.refresh();
          }
        }

        if (state.error) {
          if (typeof state.error === "string") {
            toast.error("Error al guardar", { description: state.error });
          } else {
            Object.values(state.error).forEach((errArray) => {
              (errArray as string[]).forEach((err: string) => {
                toast.error("Error de validación", { description: err });
              });
            });
          }
        }
      }
    };

    handleStateChange();
  }, [state, session, update, router]);

  const handleCopy = () => {
    if (!slugValue) {
      toast.error("Guarda tu perfil para generar la URL y poder copiarla.");
      return;
    }
    const fullUrl = `${window.location.origin}/${slugValue}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("¡URL copiada al portapapeles!");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE_MB = 4;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error("Imagen demasiado grande", {
        description: `El archivo no puede superar los ${MAX_FILE_SIZE_MB}MB.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Formato no válido", {
        description: "Por favor, sube una imagen JPG o PNG.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (imageBlob: Blob | null) => {
    if (imageBlob) {
      const croppedFile = new File([imageBlob], "avatar.png", {
        type: "image/png",
      });
      croppedImageRef.current = croppedFile;
      setAvatarPreview(URL.createObjectURL(croppedFile));
    }
    setImageToCrop(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormAction = (formData: FormData) => {
    if (croppedImageRef.current) {
      formData.set("avatar", croppedImageRef.current);
    } else {
      formData.delete("avatar");
    }
    formAction(formData);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <AvatarCropper
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        onClose={() => {
          setImageToCrop(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
      <form
        action={handleFormAction}
        className="flex flex-col items-center justify-center max-w-lg mx-auto space-y-4"
      >
        <div className="flex items-center w-full gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage
              src={avatarPreview || ""}
              alt={user.name || "Avatar"}
            />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="avatar">Foto de Perfil</Label>
            <Input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png, image/jpeg"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="file:text-primary file:font-semibold"
            />
          </div>
        </div>
        <div className="grid w-full gap-2">
          <Label htmlFor="name">Mi nombre</Label>
          <Input
            id="name"
            name="name"
            defaultValue={user.name || ""}
            required
          />
        </div>
        <div className="grid w-full gap-2">
          <Label htmlFor="barbershopName">El nombre de mi Barbería</Label>
          <Input
            id="barbershopName"
            name="barbershopName"
            defaultValue={user.barbershop?.name || ""}
            required
          />
        </div>
        <div className="grid w-full gap-2">
          <Label htmlFor="slug">Mi URL personalizada</Label>
          <div className="flex items-center">
            <span className="inline-flex items-center h-10 px-3 text-sm border border-r-0 rounded-l-md border-input bg-muted text-muted-foreground">
              turnix.app/
            </span>
            <Input
              id="slug"
              name="slug"
              value={slugValue}
              onChange={(e) =>
                setSlugValue(e.target.value.toLowerCase().replace(/\s+/g, "-"))
              }
              className="rounded-none focus-visible:ring-ring focus-visible:ring-offset-0 read-only:bg-muted/50 read-only:cursor-not-allowed"
              required={!user.barbershop?.slug}
              readOnly={!!user.barbershop?.slug}
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
                  disabled={!user.barbershop?.slug}
                >
                  {isCopied ? (
                    <Check className="w-5 h-5 mx-3 text-green-500" />
                  ) : (
                    <Clipboard className="w-5 h-5 mx-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copiar URL pública</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>
              {user.barbershop?.slug
                ? "Tu URL pública ya no se puede cambiar. Esta acción se completa una única vez."
                : "Usa minúsculas y guiones medios (-). ¡Esta acción es permanente!"}
            </p>
          </div>
        </div>
        <SubmitButton />
      </form>
    </TooltipProvider>
  );
}
