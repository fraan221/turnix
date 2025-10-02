"use client";

import { User } from "@prisma/client";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { type FormState, updateUserProfile } from "@/actions/dashboard.actions";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Clipboard, Check, Save, Loader2Icon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import dynamic from "next/dynamic";
import { Skeleton } from "./ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

const AvatarCropperContentSkeleton = () => (
  <>
    <DialogHeader>
      <DialogTitle>
        <Skeleton className="w-48 h-6" />
      </DialogTitle>
    </DialogHeader>
    <Skeleton className="w-full h-64" />
    <div className="flex items-center gap-4 py-4">
      <Skeleton className="w-6 h-6 rounded-full" />
      <Skeleton className="w-full h-2" />
      <Skeleton className="w-6 h-6 rounded-full" />
    </div>
    <DialogFooter>
      <Skeleton className="w-24 h-10" />
      <Skeleton className="w-24 h-10" />
    </DialogFooter>
  </>
);

const AvatarCropperContent = dynamic(
  () => import("./AvatarCropper").then((mod) => mod.AvatarCropperContent),
  {
    ssr: false,
  }
);

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
      id: string;
      name: string;
      slug: string;
      image: string | null;
      address: string | null;
      description: string | null;
    } | null;
  };
}

const initialState: FormState = { success: null, error: null };

export default function SettingsForm({ user }: SettingsFormProps) {
  const [state, formAction] = useFormState(updateUserProfile, initialState);
  const { data: session, update } = useSession();
  const [slugValue, setSlugValue] = useState(user.barbershop?.slug || "");
  const [barbershopImagePreview, setBarbershopImagePreview] = useState<
    string | null
  >(user.barbershop?.image || null);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const croppedImageRef = useRef<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
  const formStateRef = useRef<FormState>(initialState);
  const router = useRouter();
  const barbershopFileInputRef = useRef<HTMLInputElement>(null);
  const [barbershopImageToCrop, setBarbershopImageToCrop] = useState<
    string | null
  >(null);
  const croppedBarbershopImageRef = useRef<File | null>(null);

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
    const urlToCopy = `${window.location.origin}/${user.barbershop?.slug}`;

    if (!user.barbershop?.slug) {
      toast.error("No hay una URL que copiar para esta barbería.");
      return;
    }

    navigator.clipboard.writeText(urlToCopy);
    toast.success("¡URL copiada al portapapeles!");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: "avatar" | "barbershop"
  ) => {
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
      if (imageType === "avatar") {
        setImageToCrop(reader.result as string);
      } else {
        setBarbershopImageToCrop(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (
    imageBlob: Blob | null,
    imageType: "avatar" | "barbershop"
  ) => {
    if (imageBlob) {
      const fileName = imageType === "avatar" ? "avatar.png" : "barbershop.png";
      const croppedFile = new File([imageBlob], fileName, {
        type: "image/png",
      });
      if (imageType === "avatar") {
        croppedImageRef.current = croppedFile;
        setAvatarPreview(URL.createObjectURL(croppedFile));
      } else {
        croppedBarbershopImageRef.current = croppedFile;
        setBarbershopImagePreview(URL.createObjectURL(croppedFile));
      }
    }

    if (imageType === "avatar") {
      setImageToCrop(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setBarbershopImageToCrop(null);
      if (barbershopFileInputRef.current)
        barbershopFileInputRef.current.value = "";
    }
  };

  const handleFormAction = (formData: FormData) => {
    if (croppedImageRef.current) {
      formData.set("avatar", croppedImageRef.current);
    } else {
      formData.delete("avatar");
    }
    if (croppedBarbershopImageRef.current) {
      formData.set("barbershopImage", croppedBarbershopImageRef.current);
    } else {
      formData.delete("barbershopImage");
    }
    formAction(formData);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Dialog
        open={!!imageToCrop}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setImageToCrop(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          {imageToCrop && (
            <Suspense fallback={<AvatarCropperContentSkeleton />}>
              <AvatarCropperContent
                imageSrc={imageToCrop}
                onCropComplete={(blob) => handleCropComplete(blob, "avatar")}
                onClose={() => {
                  setImageToCrop(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!barbershopImageToCrop}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setBarbershopImageToCrop(null);
            if (barbershopFileInputRef.current)
              barbershopFileInputRef.current.value = "";
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          {barbershopImageToCrop && (
            <Suspense fallback={<AvatarCropperContentSkeleton />}>
              <AvatarCropperContent
                imageSrc={barbershopImageToCrop}
                onCropComplete={(blob) =>
                  handleCropComplete(blob, "barbershop")
                }
                onClose={() => {
                  setBarbershopImageToCrop(null);
                  if (barbershopFileInputRef.current)
                    barbershopFileInputRef.current.value = "";
                }}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
      <form
        action={handleFormAction}
        className="flex flex-col items-center justify-center mx-auto space-y-4 max-w-7xl"
      >
        <div className="w-full space-y-4">
          <div className="flex items-center w-full gap-4">
            <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-full">
              <Image
                src={avatarPreview || "/images/hero-background.jpg"}
                alt={user.name || "Avatar"}
                fill
                className="object-cover bg-muted"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="avatar">Foto de Perfil</Label>
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/png, image/jpeg"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e, "avatar")}
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
            <Label htmlFor="phone">Mi número de celular</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={user.phone || ""}
            />
          </div>
        </div>
        {user.role === Role.OWNER ? (
          <>
            <div className="w-full pt-4">
              <Separator />
            </div>
            <div className="flex items-center w-full gap-4">
              <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-full">
                <Image
                  src={barbershopImagePreview || "/images/cta-background.jpg"}
                  alt={user.barbershop?.name || "Logo Barbería"}
                  fill
                  className="object-cover bg-muted"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="barbershopImage">Foto de la Barbería</Label>
                <Input
                  id="barbershopImage"
                  name="barbershopImage"
                  type="file"
                  accept="image/png, image/jpeg"
                  ref={barbershopFileInputRef}
                  onChange={(e) => handleFileChange(e, "barbershop")}
                  className="file:text-primary file:font-semibold"
                />
              </div>
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
              <Label htmlFor="barbershopAddress">
                Dirección de mi Barbería
              </Label>
              <Input
                id="barbershopAddress"
                name="barbershopAddress"
                defaultValue={user.barbershop?.address || ""}
              />
            </div>

            <div className="grid w-full gap-2">
              <Label htmlFor="barbershopDescription">Descripción</Label>
              <Textarea
                id="barbershopDescription"
                name="barbershopDescription"
                defaultValue={user.barbershop?.description || ""}
                placeholder="Ej: La mejor barbería de la ciudad, especializada en cortes clásicos y modernos."
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
                    setSlugValue(
                      e.target.value.toLowerCase().replace(/\s+/g, "-")
                    )
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
          </>
        ) : user.role === Role.BARBER && user.barbershop?.slug ? (
          <div className="grid w-full gap-2">
            <Label htmlFor="slug">URL de la Barbería</Label>
            <div className="flex items-center">
              <span className="inline-flex items-center h-10 px-3 text-sm border border-r-0 rounded-l-md border-input bg-muted text-muted-foreground">
                turnix.app/
              </span>
              <Input
                id="slug"
                name="slug"
                value={user.barbershop.slug}
                className="rounded-none read-only:bg-muted/50 read-only:cursor-not-allowed"
                readOnly
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
          </div>
        ) : null}
        <SubmitButton />
      </form>
    </TooltipProvider>
  );
}
