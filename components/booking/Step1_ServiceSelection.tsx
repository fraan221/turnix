"use client";

import { useState } from "react";
import type { Service } from "@prisma/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDuration, formatPrice } from "@/lib/utils";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step1ServiceSelectionProps {
  services: Service[];
  initialSelectedServiceId: string;
  onNext: (selectedServiceId: string) => void;
  onBack?: () => void;
}

export function Step1_ServiceSelection({
  services,
  initialSelectedServiceId,
  onNext,
  onBack,
}: Step1ServiceSelectionProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialSelectedServiceId
  );

  const handleNextClick = () => {
    if (selectedServiceId) {
      onNext(selectedServiceId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">
          {onBack ? "Paso 2" : "Paso 1"}: Elige tu servicio
        </h3>
        <p className="text-muted-foreground">
          Selecciona el servicio que quieres para tu turno.
        </p>
      </div>

      <RadioGroup
        value={selectedServiceId}
        onValueChange={setSelectedServiceId}
        className="grid grid-cols-1 gap-4"
      >
        {services.map((service) => (
          <Label
            key={service.id}
            htmlFor={service.id}
            className={cn(
              "flex items-center p-4 space-x-4 border rounded-lg transition-colors cursor-pointer",
              "hover:bg-accent hover:text-accent-foreground",
              selectedServiceId === service.id &&
                "bg-primary/5 border-primary ring-2 ring-primary"
            )}
          >
            <RadioGroupItem value={service.id} id={service.id} />
            <div className="flex items-center justify-between flex-1">
              <div className="space-y-1">
                <h3 className="font-semibold">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}
                {service.durationInMinutes && (
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(service.durationInMinutes)}
                  </p>
                )}
              </div>
              <p className="ml-4 font-bold shrink-0">
                {formatPrice(service.price)}
              </p>
            </div>
          </Label>
        ))}
      </RadioGroup>
      <div
        className={`flex ${onBack ? "justify-between" : "justify-end"} gap-2`}
      >
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={handleNextClick}
          disabled={!selectedServiceId}
          size="lg"
        >
          Siguiente
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
