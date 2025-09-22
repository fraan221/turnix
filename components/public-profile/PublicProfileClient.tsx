"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InformationTab } from "./InformationTab";
import Image from "next/image";
import type { BarbershopWithDetails } from "@/lib/data";
import type { User } from "@prisma/client";
import { motion } from "framer-motion";
import type { WorkingHoursWithBlocks } from "@/components/schedule/ReadOnlyScheduleView";

interface PublicProfileClientProps {
  barbershop: BarbershopWithDetails;
  allBarbers: User[];
  whatsappUrl: string | null;
}

export function PublicProfileClient({
  barbershop,
  allBarbers,
  whatsappUrl,
}: PublicProfileClientProps) {
  const tabAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  const hasMultipleBarbers = allBarbers.length > 1;
  const allServices = barbershop.services;

  const [step, setStep] = useState(hasMultipleBarbers ? 0 : 1);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(
    !hasMultipleBarbers ? allBarbers[0] : null
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  const barberServices = useMemo(() => {
    if (!selectedBarber) return [];
    return allServices.filter((s) => s.barberId === selectedBarber.id);
  }, [allServices, selectedBarber]);

  const selectedServices = useMemo(
    () =>
      selectedServiceId
        ? barberServices.filter((s) => s.id === selectedServiceId)
        : [],
    [barberServices, selectedServiceId]
  );

  const handleBarberSelect = (barberId: string) => {
    const barber = allBarbers.find((b) => b.id === barberId);
    if (barber) {
      setSelectedBarber(barber);
      setSelectedServiceId("");
      setStep(1);
    }
  };

  const handleNextFromStep1 = (serviceId: string) => {
    setSelectedServiceId(serviceId);
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

  return (
    <div className="w-full max-w-4xl space-y-8">
      <Card>
        <CardHeader className="flex flex-col items-center justify-center p-6 space-y-4 text-center rounded-lg bg-card">
          {barbershop.image && (
            <div className="relative w-24 h-24 overflow-hidden rounded-full">
              <Image
                src={barbershop.image}
                alt={`Foto de ${barbershop.name}`}
                fill
                className="object-cover"
              />
            </div>
          )}
          <CardTitle className="text-3xl font-bold font-heading">
            {barbershop.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="reservas" className="w-full border rounded-lg">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reservas">Reservas</TabsTrigger>
              <TabsTrigger value="informacion">Información</TabsTrigger>
            </TabsList>

            <div>
              <TabsContent value="reservas" className="mt-0">
                <motion.div {...tabAnimation}>
                  <BookingWizard
                    barbers={allBarbers}
                    barberServices={barberServices}
                    selectedServices={selectedServices}
                    step={step}
                    selectedBarber={selectedBarber}
                    selectedServiceId={selectedServiceId}
                    selectedDateTime={selectedDateTime}
                    hasMultipleBarbers={hasMultipleBarbers}
                    handleBarberSelect={handleBarberSelect}
                    handleNextFromStep1={handleNextFromStep1}
                    handleNextFromStep2={handleNextFromStep2}
                    handleBack={handleBack}
                    setStep={setStep}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="informacion" className="mt-0">
                <motion.div {...tabAnimation}>
                  <InformationTab
                    description={barbershop.description}
                    address={barbershop.address}
                    whatsappUrl={whatsappUrl}
                    workingHours={
                      barbershop.owner.workingHours as WorkingHoursWithBlocks[]
                    }
                  />
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
