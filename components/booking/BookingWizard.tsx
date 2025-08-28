"use client";

import { useState, useMemo } from "react";
import type { Service, User } from "@prisma/client";
import { Step0_BarberSelection } from "./Step0_BarberSelection";
import { Step1_ServiceSelection } from "./Step1_ServiceSelection";
import { Step2_DateTimeSelection } from "./Step2_DateTimeSelection";
import { Step3_Confirmation } from "./Step3_Confirmation";

interface BookingWizardProps {
  barbers: User[];
  allServices: Service[];
}

export function BookingWizard({ barbers, allServices }: BookingWizardProps) {
  const hasMultipleBarbers = barbers.length > 1;

  const [step, setStep] = useState(hasMultipleBarbers ? 0 : 1);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(
    !hasMultipleBarbers ? barbers[0] : null
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  const barberServices = useMemo(() => {
    if (!selectedBarber) return [];
    return allServices.filter((s) => s.barberId === selectedBarber.id);
  }, [allServices, selectedBarber]);

  const selectedServices = useMemo(
    () => barberServices.filter((s) => selectedServiceIds.includes(s.id)),
    [barberServices, selectedServiceIds]
  );

  const handleBarberSelect = (barberId: string) => {
    const barber = barbers.find((b) => b.id === barberId);
    if (barber) {
      setSelectedBarber(barber);
      setSelectedServiceIds([]);
      setStep(1);
    }
  };

  const handleNextFromStep1 = (serviceIds: string[]) => {
    setSelectedServiceIds(serviceIds);
    setStep(2);
  };

  const handleNextFromStep2 = (dateTime: Date) => {
    setSelectedDateTime(dateTime);
    setStep(3);
  };

  const handleBack = () => {
    const minStep = hasMultipleBarbers ? 0 : 1;
    setStep((prev) => Math.max(minStep, prev - 1));
  };

  switch (step) {
    case 0:
      return (
        <Step0_BarberSelection
          barbers={barbers}
          onBarberSelect={handleBarberSelect}
        />
      );
    case 1:
      if (!selectedBarber) return null;
      return (
        <Step1_ServiceSelection
          services={barberServices}
          initialSelectedServices={selectedServiceIds}
          onNext={handleNextFromStep1}
        />
      );
    case 2:
      if (!selectedBarber) return null;
      return (
        <Step2_DateTimeSelection
          barberId={selectedBarber.id}
          selectedServices={selectedServices}
          onNext={handleNextFromStep2}
          onBack={handleBack}
        />
      );
    case 3:
      if (!selectedDateTime || !selectedBarber) {
        setStep(2);
        return null;
      }
      return (
        <Step3_Confirmation
          barberId={selectedBarber.id}
          barberName={selectedBarber.name}
          selectedServices={selectedServices}
          selectedDateTime={selectedDateTime}
          onBack={handleBack}
        />
      );
    default:
      return hasMultipleBarbers ? (
        <Step0_BarberSelection
          barbers={barbers}
          onBarberSelect={handleBarberSelect}
        />
      ) : (
        <Step1_ServiceSelection
          services={barberServices}
          initialSelectedServices={selectedServiceIds}
          onNext={handleNextFromStep1}
        />
      );
  }
}
