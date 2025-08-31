"use client";

import { useState } from "react";
import type { Service } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDuration, formatPrice } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface Step1ServiceSelectionProps {
  services: Service[];
  initialSelectedServices: string[];
  onNext: (selectedServiceIds: string[]) => void;
}

export function Step1_ServiceSelection({
  services,
  initialSelectedServices,
  onNext,
}: Step1ServiceSelectionProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialSelectedServices
  );

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleNextClick = () => {
    onNext(selectedServices);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 1: Elige tu servicio</CardTitle>
        <CardDescription>
          Selecciona uno o más servicios para tu turno.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center p-4 space-x-4 border rounded-lg has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-colors"
            >
              <Checkbox
                id={service.id}
                onCheckedChange={() => handleServiceToggle(service.id)}
                checked={selectedServices.includes(service.id)}
              />
              <Label
                htmlFor={service.id}
                className="flex items-center justify-between flex-1 cursor-pointer"
              >
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
              </Label>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleNextClick}
            disabled={selectedServices.length === 0}
            size="lg"
          >
            Siguiente
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
