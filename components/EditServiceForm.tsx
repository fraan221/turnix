"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Service } from "@prisma/client";
import { ServiceInputSchema, ServiceSchema } from "@/lib/schemas";
import { updateService } from "@/actions/service.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type ServiceFormValues = z.infer<typeof ServiceSchema>;
type ServiceFormInput = z.infer<typeof ServiceInputSchema>;

const formatPrice = (value: string): string => {
  const cleanValue = value.replace(/[^\d]/g, '');
  
  if (!cleanValue) return '';
  
  const formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return formattedValue;
};

const cleanPriceValue = (formattedValue: string): string => {
  return formattedValue.replace(/\./g, '');
};

export default function EditServiceForm({ service }: { service: Service }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [priceDisplay, setPriceDisplay] = useState(() => 
    service.price ? formatPrice(service.price.toString()) : ''
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setValue,
    trigger,
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(ServiceInputSchema),
    mode: "onChange",
    defaultValues: {
      name: service.name,
      price: service.price,
      durationInMinutes: service.durationInMinutes || "",
      description: service.description || "",
    },
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatPrice(inputValue);
    
    setPriceDisplay(formattedValue);
    
    const cleanValue = cleanPriceValue(formattedValue);
    setValue('price', cleanValue);
    
    trigger('price');
  };

  const onSubmit = (data: ServiceFormInput) => {
    startTransition(async () => {
      const serviceData = {
        name: data.name,
        price: typeof data.price === "string" ? parseFloat(data.price) : data.price,
        durationInMinutes: data.durationInMinutes 
          ? (typeof data.durationInMinutes === "string" 
              ? parseInt(data.durationInMinutes, 10) 
              : data.durationInMinutes)
          : null,
        description: data.description,
      };

      const result = await updateService(service.id, serviceData);
      if (result?.success) {
        toast.success("¡Servicio actualizado!", {
          description: result.success,
        });
        router.push("/dashboard/services");
      }
      if (result?.error) {
        toast.error("Error al actualizar", { description: result.error });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre del Servicio</Label>
        <Input 
          id="name" 
          {...register("name")}
          className={errors.name ? "border-red-500 focus:border-red-500" : ""}
        />
        {errors.name && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="price">Precio ($)</Label>
        <Input
          id="price"
          type="text"
          placeholder="Ej: 10.000"
          value={priceDisplay}
          onChange={handlePriceChange}
          onBlur={() => {
            const cleanValue = cleanPriceValue(priceDisplay);
            setValue('price', cleanValue);
            trigger('price');
          }}
          className={errors.price ? "border-red-500 focus:border-red-500" : ""}
        />
        {errors.price && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {errors.price.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="durationInMinutes">Duración (minutos) (Opcional)</Label>
        <Input
          id="durationInMinutes"
          type="number"
          {...register("durationInMinutes")}
          className={errors.durationInMinutes ? "border-red-500 focus:border-red-500" : ""}
        />
        {errors.durationInMinutes && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {errors.durationInMinutes.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descripción (Opcional)</Label>
        <Textarea 
          id="description" 
          {...register("description")}
          className={errors.description ? "border-red-500 focus:border-red-500" : ""}
        />
        {errors.description && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {errors.description.message}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Link href="/dashboard/services">
          <Button type="button" variant="secondary">
            Cancelar
          </Button>
        </Link>
        <Button 
          type="submit" 
          disabled={isSubmitting || isPending || !isValid}
          className="min-w-[120px]"
        >
          {isSubmitting || isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
