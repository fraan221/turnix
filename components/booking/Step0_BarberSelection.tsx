"use client";

import { useState } from "react";
import type { User } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <Card>
      <CardHeader>
        <CardTitle>Paso 1: Elige tu barbero</CardTitle>
        <CardDescription>
          Selecciona el profesional con el que quieres atenderte.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                <Avatar className="w-16 h-16 mb-3">
                  <AvatarImage
                    src={barber.image ?? ""}
                    alt={barber.name ?? "Avatar"}
                  />
                  <AvatarFallback>
                    {barber.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-center">{barber.name}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleNextClick}
          disabled={!selectedBarberId}
          size="lg"
        >
          Siguiente
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
