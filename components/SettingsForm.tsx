"use client";

import { User } from "@prisma/client";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Loader2Icon,
  User as UserIcon,
  Store,
  Link as LinkIcon,
  Shield,
  CreditCard,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { upload } from "@vercel/blob/client";

import {
  PersonalInfoSection,
  BarbershopInfoSection,
  CustomUrlSection,
  SecuritySection,
  PaymentsSection,
  BillingSettingsSection,
} from "./settings";
import { SettingsNav, type SettingsNavItem } from "./settings/SettingsNav";
import { Crown } from "lucide-react";

const AvatarCropperContentSkeleton = () => (
  <>
    <DialogHeader>
      <DialogTitle>
        <Skeleton className="w-48 h-6" />
      </DialogTitle>
    </DialogHeader>
    <Skeleton className="w-full h-64" />
    <div className="flex gap-4 items-center py-4">
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
  { ssr: false }
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
          <Loader2Icon className="mr-2 w-4 h-4 animate-spin" />
          <span>Guardando...</span>
        </>
      ) : (
        <>
          <Save className="mr-2 w-4 h-4" />
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
  subscription?: {
    status: string;
    currentPeriodEnd: Date;
    mercadopagoSubscriptionId: string;
    discountedUntil?: Date | null;
    discountCode?: { overridePrice: number } | null;
  } | null;
  trialEndsAt?: Date | null;
}

export default function SettingsForm({ user, subscription, trialEndsAt }: SettingsFormProps) {
  const { data: session, update } = useSession();

  const [isPending, setIsPending] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");

  const formRef = useRef<HTMLFormElement>(null);
  const croppedImageRef = useRef<File | null>(null);
  const croppedBarbershopImageRef = useRef<File | null>(null);

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

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
  const [barbershopImagePreview, setBarbershopImagePreview] = useState<
    string | null
  >(user.barbershop?.image || null);

  const [isCopied, setIsCopied] = useState(false);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/png");
  const [barbershopImageToCrop, setBarbershopImageToCrop] = useState<
    string | null
  >(null);
  const [barbershopImageMimeType, setBarbershopImageMimeType] =
    useState<string>("image/png");

  const navItems: SettingsNavItem[] = [
    {
      id: "personal",
      label: "Perfil",
      icon: UserIcon,
    },
    ...(user.role === Role.OWNER
      ? [
          {
            id: "barbershop",
            label: "Barbería",
            icon: Store,
          },
          {
            id: "url",
            label: "URL",
            icon: LinkIcon,
          },
        ]
      : []),
    ...(user.role === Role.BARBER && user.barbershop?.slug
      ? [
          {
            id: "url",
            label: "URL",
            icon: LinkIcon,
          },
        ]
      : []),
    ...(user.role === Role.OWNER
      ? [
          {
            id: "billing",
            label: "Suscripción",
            icon: Crown,
          },
        ]
      : []),
    {
      id: "security",
      label: "Seguridad",
      icon: Shield,
      disabled: true,
      badge: "Pronto",
    },
    {
      id: "payments",
      label: "Pagos",
      icon: CreditCard,
      disabled: true,
      badge: "Pronto",
    },
  ];

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

  const handleAvatarSelect = (_file: File, dataUrl: string) => {
    setImageToCrop(dataUrl);
    const type = dataUrl.startsWith("data:image/jpeg")
      ? "image/jpeg"
      : "image/png";
    setImageMimeType(type);
  };

  const handleBarbershopImageSelect = (_file: File, dataUrl: string) => {
    setBarbershopImageToCrop(dataUrl);
    const type = dataUrl.startsWith("data:image/jpeg")
      ? "image/jpeg"
      : "image/png";
    setBarbershopImageMimeType(type);
  };

  const handleCropComplete = (
    imageBlob: Blob | null,
    imageType: "avatar" | "barbershop"
  ) => {
    if (imageBlob) {
      const mimeType =
        imageType === "avatar" ? imageMimeType : barbershopImageMimeType;
      const extension = mimeType === "image/jpeg" ? "jpg" : "png";
      const fileName =
        imageType === "avatar"
          ? `avatar.${extension}`
          : `barbershop.${extension}`;

      const croppedFile = new File([imageBlob], fileName, {
        type: mimeType,
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
    } else {
      setBarbershopImageToCrop(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;

    setIsPending(true);

    try {
      const formData = new FormData(formRef.current);
      let avatarUrl = null;
      let barbershopImageUrl = null;

      if (croppedImageRef.current) {
        const ext = croppedImageRef.current.name.split(".").pop();
        const filename = `avatar-${Date.now()}.${ext}`;
        const blob = await upload(filename, croppedImageRef.current, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        avatarUrl = blob.url;
      }

      if (croppedBarbershopImageRef.current) {
        const ext = croppedBarbershopImageRef.current.name.split(".").pop();
        const filename = `barbershop-${Date.now()}.${ext}`;
        const blob = await upload(filename, croppedBarbershopImageRef.current, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        barbershopImageUrl = blob.url;
      }

      if (avatarUrl) {
        formData.set("avatarUrl", avatarUrl);
      }
      if (barbershopImageUrl) {
        formData.set("barbershopImageUrl", barbershopImageUrl);
      }

      formData.delete("avatar");
      formData.delete("barbershopImage");

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

      if (result.success && result.data) {
        toast.success("Perfil actualizado", {
          description: "Tus cambios se guardaron correctamente",
        });

        const { user: updatedUser, barbershop: updatedBarbershop } =
          result.data;
        const sessionUpdateData: Record<string, unknown> = {};

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

  const renderSection = () => {
    switch (activeSection) {
      case "personal":
        return (
          <>
            <PersonalInfoSection
              name={name}
              phone={phone}
              avatarPreview={avatarPreview}
              onNameChange={setName}
              onPhoneChange={setPhone}
              onAvatarSelect={handleAvatarSelect}
            />
            <div className="flex justify-end mt-6">
              <SubmitButton isPending={isPending} />
            </div>
          </>
        );

      case "barbershop":
        if (user.role !== Role.OWNER) return null;
        return (
          <>
            <BarbershopInfoSection
              name={barbershopName}
              address={barbershopAddress}
              description={barbershopDescription}
              imagePreview={barbershopImagePreview}
              onNameChange={setBarbershopName}
              onAddressChange={setBarbershopAddress}
              onDescriptionChange={setBarbershopDescription}
              onImageSelect={handleBarbershopImageSelect}
            />
            <div className="flex justify-end mt-6">
              <SubmitButton isPending={isPending} />
            </div>
          </>
        );

      case "url":
        if (user.role === Role.OWNER) {
          return (
            <CustomUrlSection
              slug={slugValue}
              isConfigured={!!user.barbershop?.slug}
              isCopied={isCopied}
              onSlugChange={setSlugValue}
              onCopy={handleCopy}
            />
          );
        }
        if (user.role === Role.BARBER && user.barbershop?.slug) {
          return (
            <CustomUrlSection
              slug={user.barbershop.slug}
              isConfigured={true}
              isCopied={isCopied}
              readOnly
              onCopy={handleCopy}
            />
          );
        }
        return null;

      case "billing":
        if (user.role !== Role.OWNER) return null;
        return (
          <BillingSettingsSection
            subscription={subscription ?? null}
            trialEndsAt={trialEndsAt ?? null}
          />
        );

      case "security":
        return <SecuritySection />;

      case "payments":
        return <PaymentsSection />;

      default:
        return null;
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Dialog
        open={!!imageToCrop}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setImageToCrop(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] rounded-lg">
          {imageToCrop && (
            <Suspense fallback={<AvatarCropperContentSkeleton />}>
              <AvatarCropperContent
                imageSrc={imageToCrop}
                outputMimeType={imageMimeType}
                onCropComplete={(blob) => handleCropComplete(blob, "avatar")}
                onClose={() => setImageToCrop(null)}
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
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] rounded-lg">
          {barbershopImageToCrop && (
            <Suspense fallback={<AvatarCropperContentSkeleton />}>
              <AvatarCropperContent
                imageSrc={barbershopImageToCrop}
                outputMimeType={barbershopImageMimeType}
                onCropComplete={(blob) =>
                  handleCropComplete(blob, "barbershop")
                }
                onClose={() => setBarbershopImageToCrop(null)}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>

      <form ref={formRef} onSubmit={handleSubmit} className="pb-6">
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="phone" value={phone} />
        {user.role === Role.OWNER && (
          <>
            <input type="hidden" name="barbershopName" value={barbershopName} />
            <input type="hidden" name="barbershopAddress" value={barbershopAddress} />
            <input type="hidden" name="barbershopDescription" value={barbershopDescription} />
            <input type="hidden" name="slug" value={slugValue} />
          </>
        )}

        <div className="flex flex-col md:flex-row md:gap-8">
          <SettingsNav
            items={navItems}
            activeId={activeSection}
            onSelect={setActiveSection}
          />

          <div className="flex-1 min-w-0">
            {renderSection()}
          </div>
        </div>
      </form>
    </TooltipProvider>
  );
}
