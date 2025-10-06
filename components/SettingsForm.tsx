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
import {
  Clipboard,
  Check,
  Save,
  Loader2Icon,
  User as UserIcon,
  Store,
  Link as LinkIcon,
  Camera,
} from "lucide-react";
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
    <Button
      type="submit"
      className="w-full sm:w-auto sm:min-w-[180px]"
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
          toast.success("Perfil actualizado", {
            description: "Tus cambios se guardaron correctamente",
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
            console.log("Antes update:", session?.user.image);
            await update(dataToUpdate);
            console.log("Después update:", session?.user.image);
            await new Promise((resolve) => setTimeout(resolve, 100));
            router.refresh();
            console.log("Después refresh");
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
      toast.error("No hay URL para copiar", {
        description: "Primero necesitás crear tu URL personalizada",
      });
      return;
    }

    navigator.clipboard.writeText(urlToCopy);
    toast.success("URL copiada al portapapeles");
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
        description: `El archivo no puede superar los ${MAX_FILE_SIZE_MB}MB`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Formato no válido", {
        description: "Usá una imagen JPG o PNG",
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
        const previewUrl = URL.createObjectURL(croppedFile);
        setAvatarPreview(previewUrl);
      } else {
        croppedBarbershopImageRef.current = croppedFile;
        const previewUrl = URL.createObjectURL(croppedFile);
        setBarbershopImagePreview(previewUrl);
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
        <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] rounded-lg">
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
        <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] rounded-lg">
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

      <form action={handleFormAction} className="pb-6 space-y-8">
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-4 md:px-0">
            <UserIcon className="w-5 h-5 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Información personal
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tu nombre y foto de perfil
              </p>
            </div>
          </div>

          <div className="px-4 space-y-4 md:px-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative w-20 h-20 overflow-hidden rounded-full shrink-0 ring-2 ring-border">
                <Image
                  src={avatarPreview || "/images/hero-background.jpg"}
                  alt={user.name || "Avatar"}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/50 hover:opacity-100"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="avatar" className="text-sm font-medium">
                  Foto de perfil
                </Label>
                <Input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/png, image/jpeg"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e, "avatar")}
                  className="file:text-primary file:font-medium"
                />
                <p className="text-xs text-muted-foreground">
                  JPG o PNG. Máximo 4MB
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre completo
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name || ""}
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
                defaultValue={user.phone || ""}
                placeholder="Ej: +54 9 11 1234-5678"
              />
            </div>
          </div>
        </section>

        {user.role === Role.OWNER && (
          <>
            <Separator className="mx-4 md:mx-0" />

            <section className="space-y-6">
              <div className="flex items-center gap-2 px-4 md:px-0">
                <Store className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Información de la barbería
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Datos que verán tus clientes
                  </p>
                </div>
              </div>

              <div className="px-4 space-y-4 md:px-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative w-20 h-20 overflow-hidden rounded-full shrink-0 ring-2 ring-border">
                    <Image
                      src={
                        barbershopImagePreview || "/images/cta-background.jpg"
                      }
                      alt={user.barbershop?.name || "Logo Barbería"}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => barbershopFileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/50 hover:opacity-100"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label
                      htmlFor="barbershopImage"
                      className="text-sm font-medium"
                    >
                      Logo de la barbería
                    </Label>
                    <Input
                      id="barbershopImage"
                      name="barbershopImage"
                      type="file"
                      accept="image/png, image/jpeg"
                      ref={barbershopFileInputRef}
                      onChange={(e) => handleFileChange(e, "barbershop")}
                      className="file:text-primary file:font-medium"
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG o PNG. Máximo 4MB
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="barbershopName"
                    className="text-sm font-medium"
                  >
                    Nombre de la barbería
                  </Label>
                  <Input
                    id="barbershopName"
                    name="barbershopName"
                    defaultValue={user.barbershop?.name || ""}
                    placeholder="Ej: Barbería El Corte"
                    required
                  />
                </div>

                {/* Dirección */}
                <div className="space-y-2">
                  <Label
                    htmlFor="barbershopAddress"
                    className="text-sm font-medium"
                  >
                    Dirección{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="barbershopAddress"
                    name="barbershopAddress"
                    defaultValue={user.barbershop?.address || ""}
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="barbershopDescription"
                    className="text-sm font-medium"
                  >
                    Descripción{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Textarea
                    id="barbershopDescription"
                    name="barbershopDescription"
                    defaultValue={user.barbershop?.description || ""}
                    placeholder="Contale a tus clientes sobre tu barbería, especialidades, años de experiencia..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparecerá en tu página pública
                  </p>
                </div>
              </div>
            </section>

            <Separator className="mx-4 md:mx-0" />

            <section className="space-y-6">
              <div className="flex items-center gap-2 px-4 md:px-0">
                <LinkIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    URL personalizada
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Tu dirección única para compartir con clientes
                  </p>
                </div>
              </div>

              <div className="px-4 space-y-4 md:px-0">
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    Tu URL en Turnix
                  </Label>
                  <div className="flex flex-col sm:flex-row">
                    <span className="inline-flex items-center h-10 px-3 text-sm border border-b-0 sm:border-b sm:border-r-0 rounded-t-md sm:rounded-t-none sm:rounded-l-md border-input bg-muted text-muted-foreground shrink-0">
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
                      className="rounded-t-none sm:rounded-t sm:rounded-l-none sm:rounded-r-none focus-visible:ring-ring focus-visible:ring-offset-0 read-only:bg-muted/50 read-only:cursor-not-allowed"
                      placeholder="nombre-barberia"
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
                          className="w-full h-10 border-t-0 sm:border-t sm:border-l-0 rounded-b-md sm:rounded-b-none sm:rounded-r-md sm:w-10"
                          aria-label="Copiar URL"
                          disabled={!user.barbershop?.slug}
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clipboard className="w-4 h-4" />
                          )}
                          <span className="ml-2 sm:hidden">
                            {isCopied ? "Copiado" : "Copiar URL"}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="hidden sm:block">
                        <p>Copiar URL pública</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="p-3 border rounded-md bg-muted/50 border-muted">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {user.barbershop?.slug ? (
                        <>
                          <span className="font-medium text-foreground">
                            Tu URL está configurada.
                          </span>{" "}
                          Esta acción se completa una única vez y no se puede
                          cambiar.
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-foreground">
                            Elegí con cuidado.
                          </span>{" "}
                          Una vez guardada, tu URL no se puede cambiar. Usá solo
                          minúsculas y guiones medios (-).
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {user.role === Role.BARBER && user.barbershop?.slug && (
          <>
            <Separator className="mx-4 md:mx-0" />

            <section className="space-y-6">
              <div className="flex items-center gap-2 px-4 md:px-0">
                <LinkIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    URL de la barbería
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Compartí esta dirección con tus clientes
                  </p>
                </div>
              </div>

              <div className="px-4 space-y-4 md:px-0">
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    URL pública
                  </Label>
                  <div className="flex flex-col sm:flex-row">
                    <span className="inline-flex items-center h-10 px-3 text-sm border border-b-0 sm:border-b sm:border-r-0 rounded-t-md sm:rounded-t-none sm:rounded-l-md border-input bg-muted text-muted-foreground shrink-0">
                      turnix.app/
                    </span>
                    <Input
                      id="slug"
                      name="slug"
                      value={user.barbershop.slug}
                      className="rounded-t-none sm:rounded-t sm:rounded-l-none sm:rounded-r-none read-only:bg-muted/50 read-only:cursor-not-allowed"
                      readOnly
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopy}
                          className="w-full h-10 border-t-0 sm:border-t sm:border-l-0 rounded-b-md sm:rounded-b-none sm:rounded-r-md sm:w-10"
                          aria-label="Copiar URL"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clipboard className="w-4 h-4" />
                          )}
                          <span className="ml-2 sm:hidden">
                            {isCopied ? "Copiado" : "Copiar URL"}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="hidden sm:block">
                        <p>Copiar URL pública</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <div className="flex justify-end px-4 pt-4 md:px-0">
          <SubmitButton />
        </div>
      </form>
    </TooltipProvider>
  );
}
