"use client";

import { useState, useMemo } from "react";
import type { Service } from "@prisma/client";
import { Step1_ServiceSelection } from "./Step1_ServiceSelection";
import { Step2_DateTimeSelection } from "./Step2_DateTimeSelection";
import { Step3_Confirmation } from "./Step3_Confirmation";

interface BookingWizardProps {
  services: Service[];
  barberId: string;
}

export function BookingWizard({ services, barberId }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  const handleNextFromStep1 = (serviceIds: string[]) => {
    setSelectedServiceIds(serviceIds);
    setStep(2);
  };

  const handleNextFromStep2 = (dateTime: Date) => {
    setSelectedDateTime(dateTime);
    setStep(3);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  switch (step) {
    case 1:
      return (
        <Step1_ServiceSelection
          services={services}
          initialSelectedServices={selectedServiceIds}
          onNext={handleNextFromStep1}
        />
      );
    case 2:
      return (
        <Step2_DateTimeSelection
          barberId={barberId}
          selectedServices={selectedServices}
          onNext={handleNextFromStep2}
          onBack={handleBack}
        />
      );
    case 3:
      if (!selectedDateTime) {
        setStep(2);
        return null;
      }
      return (
        <Step3_Confirmation
          barberId={barberId}
          selectedServices={selectedServices}
          selectedDateTime={selectedDateTime}
          onBack={handleBack}
        />
      );
    default:
      return (
        <Step1_ServiceSelection
          services={services}
          initialSelectedServices={selectedServiceIds}
          onNext={handleNextFromStep1}
        />
      );
  }
}
