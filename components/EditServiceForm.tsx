"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Service } from "@prisma/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { ServiceInputSchema } from "@/lib/schemas";
import { updateService } from "@/actions/service.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type ServiceFormInput = z.infer<typeof ServiceInputSchema>;

const formatPrice = (value: string): string => {
  const cleanValue = value.replace(/[^\d]/g, "");
  if (!cleanValue) return "";
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const cleanPriceValue = (formattedValue: string): string => {
  return formattedValue.replace(/\./g, "");
};

interface EditServiceFormProps {
  service: Service & { activeDurationInMinutes?: number | null };
}

export default function EditServiceForm({ service }: EditServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [priceDisplay, setPriceDisplay] = useState(() =>
    service.price ? formatPrice(service.price.toString()) : ""
  );
  const [allowsOverlapping, setAllowsOverlapping] = useState(
    service.activeDurationInMinutes !== null && service.activeDurationInMinutes !== undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    setValue,
    trigger,
    watch,
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(ServiceInputSchema),
    mode: "onChange",
    defaultValues: {
      name: service.name,
      price: service.price,
      durationInMinutes: service.durationInMinutes || "",
      activeDurationInMinutes: service.activeDurationInMinutes || null,
      description: service.description || "",
    },
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatPrice(inputValue);
    setPriceDisplay(formattedValue);
    const cleanValue = cleanPriceValue(formattedValue);
    setValue("price", cleanValue, { shouldDirty: true });
    trigger("price");
  };

  const onSubmit = (data: ServiceFormInput) => {
    startTransition(async () => {
      const serviceData = {
        name: data.name,
        price:
          typeof data.price === "string" ? parseFloat(data.price) : data.price,
        durationInMinutes: data.durationInMinutes
          ? typeof data.durationInMinutes === "string"
            ? parseInt(data.durationInMinutes, 10)
            : data.durationInMinutes
          : null,
        activeDurationInMinutes: allowsOverlapping && data.activeDurationInMinutes
          ? typeof data.activeDurationInMinutes === "string"
            ? parseInt(data.activeDurationInMinutes, 10)
            : data.activeDurationInMinutes
          : null,
        description: data.description,
      };

      const result = await updateService(service.id, serviceData);
      if (result?.success) {
        toast.success("¡Cambios guardados!", {
          description: "El servicio se actualizó correctamente.",
        });
        router.push("/dashboard/services");
      }
      if (result?.error) {
        toast.error("No se pudieron guardar los cambios", {
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/services">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Volver a servicios</span>
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Editar Servicio</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Modificá los datos de "{service.name}"
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nombre del servicio
          </Label>
          <Input
            id="name"
            placeholder="Ej: Corte Fade, Barba Completa"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <span className="w-1 h-1 rounded-full bg-destructive" />
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Precio
            </Label>
            <div className="relative">
              <span className="absolute -translate-y-1/2 left-3 top-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                type="text"
                placeholder="10.000"
                value={priceDisplay}
                onChange={handlePriceChange}
                onBlur={() => {
                  const cleanValue = cleanPriceValue(priceDisplay);
                  setValue("price", cleanValue, { shouldDirty: true });
                  trigger("price");
                }}
                className={`pl-7 ${errors.price ? "border-destructive" : ""}`}
              />
            </div>
            {errors.price && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <span className="w-1 h-1 rounded-full bg-destructive" />
                {errors.price.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationInMinutes" className="text-sm font-medium">
              Duración{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="durationInMinutes"
                type="number"
                placeholder="30"
                {...register("durationInMinutes")}
                className={errors.durationInMinutes ? "border-destructive" : ""}
              />
              <span className="absolute text-xs -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
                min
              </span>
            </div>
            {errors.durationInMinutes && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <span className="w-1 h-1 rounded-full bg-destructive" />
                {errors.durationInMinutes.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="allowOverlapping"
              className="mt-1"
              checked={allowsOverlapping}
              onCheckedChange={(checked) => {
                setAllowsOverlapping(!!checked);
                if (checked) {
                  const baseDuration = watch("durationInMinutes");
                  const parsedDuration =
                    typeof baseDuration === "string"
                      ? parseInt(baseDuration, 10)
                      : baseDuration;
                  setValue(
                    "activeDurationInMinutes",
                    parsedDuration && parsedDuration > 0
                      ? Math.min(parsedDuration, 60)
                      : 60,
                    { shouldDirty: true, shouldValidate: true },
                  );
                  return;
                }

                setValue("activeDurationInMinutes", null, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            <div className="space-y-1">
              <Label htmlFor="allowOverlapping" className="text-sm font-medium">
                Permitir sobreturnos
              </Label>
              <p className="text-xs text-muted-foreground">
                Definí cuánto tiempo requiere atención activa. El resto queda
                libre para otros turnos.
              </p>
            </div>
          </div>

          {allowsOverlapping && (
            <div className="space-y-2">
              <Label
                htmlFor="activeDurationInMinutes"
                className="text-sm font-medium"
              >
                Tiempo activo
              </Label>
              <div className="relative">
                <Input
                  id="activeDurationInMinutes"
                  type="number"
                  min={1}
                  placeholder="60"
                  {...register("activeDurationInMinutes")}
                  className={
                    errors.activeDurationInMinutes ? "border-destructive" : ""
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  min
                </span>
              </div>
              {errors.activeDurationInMinutes && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <span className="h-1 w-1 rounded-full bg-destructive" />
                  {errors.activeDurationInMinutes.message}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Descripción{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Textarea
            id="description"
            placeholder="Ej: Incluye lavado, corte con máquina y tijera, y peinado final"
            rows={3}
            {...register("description")}
            className={errors.description ? "border-destructive" : ""}
          />
          {errors.description && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <span className="w-1 h-1 rounded-full bg-destructive" />
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 pt-4 border-t sm:flex-row">
          <Link href="/dashboard/services" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || isPending || !isValid || !isDirty}
            className="w-full sm:w-auto min-w-[160px]"
          >
            {isSubmitting || isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
