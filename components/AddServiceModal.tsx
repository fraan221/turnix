"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ServiceInputSchema } from "@/lib/schemas";
import { createService } from "@/actions/service.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";

interface AddServiceModalContentProps {
  onClose: () => void;
}

type ServiceFormInput = z.infer<typeof ServiceInputSchema>;

const formatPrice = (value: string): string => {
  const cleanValue = value.replace(/[^\d]/g, "");
  if (!cleanValue) return "";
  if (cleanValue.length > 6) {
    return formatPrice(cleanValue.slice(0, 6));
  }
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const cleanPriceValue = (formattedValue: string): string => {
  return formattedValue.replace(/\./g, "");
};

export function AddServiceModalContent({
  onClose,
}: AddServiceModalContentProps) {
  const [isPending, startTransition] = useTransition();
  const [priceDisplay, setPriceDisplay] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    setValue,
    trigger,
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(ServiceInputSchema),
    mode: "onChange",
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatPrice(inputValue);
    setPriceDisplay(formattedValue);
    const cleanValue = cleanPriceValue(formattedValue);
    setValue("price", cleanValue);
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
        description: data.description,
      };

      const result = await createService(serviceData);
      if (result?.success) {
        toast.success("¡Servicio creado!", {
          description: "Ya está disponible para agendar turnos.",
        });
        reset();
        setPriceDisplay("");
        onClose();
      }
      if (result?.error) {
        toast.error("No se pudo crear el servicio", {
          description: result.error,
        });
      }
    });
  };

  return (
    <>
      <DialogHeader className="space-y-3">
        <DialogTitle className="text-xl sm:text-2xl">
          Crear Nuevo Servicio
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Completá los datos del servicio que ofrecés a tus clientes
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="py-4 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nombre del servicio
          </Label>
          <Input
            id="name"
            placeholder="Ej: Corte, Ribete, Afeitado tradicional"
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
                  setValue("price", cleanValue);
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

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Descripción{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Textarea
            id="description"
            placeholder="Ej: Incluye lavado, productos y secado"
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

        {/* Footer con botones */}
        <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isSubmitting || isPending || !isValid}
            className="w-full sm:w-auto min-w-[140px]"
          >
            {isSubmitting || isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Servicio"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
