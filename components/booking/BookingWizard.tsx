"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Service, User } from "@prisma/client";
import { Step0_BarberSelection } from "./Step0_BarberSelection";
import { Step1_ServiceSelection } from "./Step1_ServiceSelection";
import { Step2_DateTimeSelection } from "./Step2_DateTimeSelection";
import { Step3_Confirmation } from "./Step3_Confirmation";

interface BookingWizardProps {
  barbers: User[];
  barberServices: Service[];
  selectedServices: Service[];
  step: number;
  selectedBarber: User | null;
  selectedServiceId: string;
  selectedDateTime: Date | null;
  hasMultipleBarbers: boolean;
  handleBarberSelect: (barberId: string) => void;
  handleNextFromStep1: (serviceId: string) => void;
  handleNextFromStep2: (dateTime: Date) => void;
  handleBack: () => void;
  setStep: (step: number) => void;
}

export function BookingWizard({
  barbers,
  barberServices,
  selectedServices,
  step,
  selectedBarber,
  selectedServiceId,
  selectedDateTime,
  hasMultipleBarbers,
  handleBarberSelect,
  handleNextFromStep1,
  handleNextFromStep2,
  handleBack,
  setStep,
}: BookingWizardProps) {
  return (
    <div className="p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {(() => {
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
                    initialSelectedServiceId={selectedServiceId}
                    onNext={handleNextFromStep1}
                    onBack={hasMultipleBarbers ? handleBack : undefined}
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
                    hasMultipleBarbers={hasMultipleBarbers}
                  />
                );
              default:
                return null;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
