"use client";

import { useState } from "react";
import type { User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step0_BarberSelectionProps {
  barbers: User[];
  onBarberSelect: (barberId: string) => void;
}

export function Step0_BarberSelection({
  barbers,
  onBarberSelect,
}: Step0_BarberSelectionProps) {
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  const handleNextClick = () => {
    if (selectedBarberId) {
      onBarberSelect(selectedBarberId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Paso 1: Elige tu barbero</h3>
        <p className="text-muted-foreground">
          Selecciona el profesional con el que quieres atenderte.
        </p>
      </div>
      <RadioGroup
        value={selectedBarberId ?? ""}
        onValueChange={setSelectedBarberId}
        className="grid grid-cols-2 gap-4 md:grid-cols-3"
      >
        {barbers.map((barber) => (
          <div key={barber.id}>
            <RadioGroupItem
              value={barber.id}
              id={barber.id}
              className="sr-only"
            />
            <Label
              htmlFor={barber.id}
              className={cn(
                "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all",
                "hover:bg-accent hover:text-accent-foreground",
                selectedBarberId === barber.id &&
                  "border-primary ring-2 ring-primary"
              )}
            >
              <div className="relative flex-shrink-0 w-16 h-16 mb-3 overflow-hidden rounded-full">
                {barber.image ? (
                  <Image
                    src={barber.image}
                    alt={barber.name ?? "Avatar"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-xl font-semibold rounded-full bg-muted text-muted-foreground">
                    {barber.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="font-semibold text-center">{barber.name}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
      <div className="flex justify-end">
        <Button
          onClick={handleNextClick}
          disabled={!selectedBarberId}
          size="lg"
        >
          Siguiente
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
