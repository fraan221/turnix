"use client";

import { User } from "@prisma/client";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useState, useRef, Suspense } from "react";
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

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      type="submit"
      className="w-full sm:w-auto sm:min-w-[180px]"
      disabled={isPending}
    >
      {isPending ? (
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

export default function SettingsForm({ user }: SettingsFormProps) {
  const { data: session, update } = useSession();

  // Component State
  const [isPending, setIsPending] = useState(false);

  // Refs
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const croppedImageRef = useRef<File | null>(null);
  const barbershopFileInputRef = useRef<HTMLInputElement>(null);
  const croppedBarbershopImageRef = useRef<File | null>(null);

  // Controlled component states
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [barbershopName, setBarbershopName] = useState(
    user.barbershop?.name || ""
  );
  const [barbershopAddress, setBarbershopAddress] = useState(
    user.barbershop?.address || ""
  );
  const [barbershopDescription, setBarbershopDescription] = useState(
    user.barbershop?.description || ""
  );
  const [slugValue, setSlugValue] = useState(user.barbershop?.slug || "");

  // Image and preview states
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
  const [barbershopImagePreview, setBarbershopImagePreview] = useState<
    string | null
  >(user.barbershop?.image || null);

  // UI and helper states
  const [isCopied, setIsCopied] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [barbershopImageToCrop, setBarbershopImageToCrop] = useState<
    string | null
  >(null);

  const handleCopy = () => {
    const urlToCopy = `${window.location.origin}/${slugValue}`;

    if (!slugValue) {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;

    setIsPending(true);

    try {
      const formData = new FormData(formRef.current);

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

      const response = await fetch("/api/profile/update", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (typeof result.error === "string") {
          toast.error("Error al guardar", { description: result.error });
        } else {
          Object.values(result.error).forEach((errArray) => {
            (errArray as string[]).forEach((err: string) => {
              toast.error("Error de validación", { description: err });
            });
          });
        }
        return;
      }

      // Handle success
      if (result.success && result.data) {
        toast.success("Perfil actualizado", {
          description: "Tus cambios se guardaron correctamente",
        });

        const { user: updatedUser, barbershop: updatedBarbershop } =
          result.data;
        const sessionUpdateData: any = {};

        // Update local form state from server response
        if (updatedUser) {
          setName(updatedUser.name || "");
          setPhone(updatedUser.phone || "");
          sessionUpdateData.name = updatedUser.name;

          if (updatedUser.image) {
            const cacheBustedUrl = `${
              updatedUser.image
            }?v=${new Date().getTime()}`;
            setAvatarPreview(cacheBustedUrl);
            sessionUpdateData.image = cacheBustedUrl;
          }
        }

        if (updatedBarbershop) {
          setBarbershopName(updatedBarbershop.name || "");
          setBarbershopAddress(updatedBarbershop.address || "");
          setBarbershopDescription(updatedBarbershop.description || "");
          setSlugValue(updatedBarbershop.slug || "");
          if (updatedBarbershop.image) {
            const cacheBustedUrl = `${
              updatedBarbershop.image
            }?v=${new Date().getTime()}`;
            setBarbershopImagePreview(cacheBustedUrl);
          }
          sessionUpdateData.barbershop = {
            ...session?.user.barbershop,
            slug: updatedBarbershop.slug,
          };
        }

        // Update NextAuth session for components like UserNav
        if (Object.keys(sessionUpdateData).length > 0) {
          await update(sessionUpdateData);
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Error inesperado", {
        description: "Ocurrió un error al enviar el formulario.",
      });
    } finally {
      setIsPending(false);
    }
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

      <form ref={formRef} onSubmit={handleSubmit} className="pb-6 space-y-8">
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
                  alt={name || "Avatar"}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                      alt={barbershopName || "Logo Barbería"}
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
                    value={barbershopName}
                    onChange={(e) => setBarbershopName(e.target.value)}
                    placeholder="Ej: Barbería El Corte"
                    required
                  />
                </div>

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
                    value={barbershopAddress}
                    onChange={(e) => setBarbershopAddress(e.target.value)}
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
                    value={barbershopDescription}
                    onChange={(e) => setBarbershopDescription(e.target.value)}
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
                          disabled={!slugValue}
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
          <SubmitButton isPending={isPending} />
        </div>
      </form>
    </TooltipProvider>
  );
}
