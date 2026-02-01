"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const stepParam = searchParams.get("step");
  const barberIdParam = searchParams.get("barberId");
  const serviceIdParam = searchParams.get("serviceId");
  const dateParam = searchParams.get("date");

  const selectedBarber = useMemo(() => {
    if (!hasMultipleBarbers) return allBarbers[0];
    return allBarbers.find((b) => b.id === barberIdParam) || null;
  }, [allBarbers, hasMultipleBarbers, barberIdParam]);

  const selectedServiceId = serviceIdParam || "";

  const selectedDateTime = useMemo(() => {
    return dateParam ? new Date(dateParam) : null;
  }, [dateParam]);

  const step = useMemo(() => {
    if (stepParam) return parseInt(stepParam);
    if (selectedDateTime) return 3;
    if (selectedServiceId) return 2;
    if (selectedBarber) return 1;
    return hasMultipleBarbers ? 0 : 1;
  }, [
    stepParam,
    selectedDateTime,
    selectedServiceId,
    selectedBarber,
    hasMultipleBarbers,
  ]);

  const barberServices = useMemo(() => {
    if (!selectedBarber) return [];
    return allServices.filter((s) => s.barberId === selectedBarber.id);
  }, [allServices, selectedBarber]);

  const selectedServices = useMemo(
    () =>
      selectedServiceId
        ? barberServices.filter((s) => s.id === selectedServiceId)
        : [],
    [barberServices, selectedServiceId],
  );

  const handleBarberSelect = (barberId: string) => {
    updateParams({
      barberId,
      step: "1",
      serviceId: null,
      date: null,
    });
  };

  const handleNextFromStep1 = (serviceId: string) => {
    updateParams({
      serviceId,
      step: "2",
      date: null,
    });
  };

  const handleNextFromStep2 = (dateTime: Date) => {
    updateParams({
      date: dateTime.toISOString(),
      step: "3",
    });
  };

  const handleBack = () => {
    const minStep = hasMultipleBarbers ? 0 : 1;
    const prevStep = Math.max(minStep, step - 1);

    const updates: Record<string, string | null> = {
      step: prevStep.toString(),
    };
    if (prevStep < 3) updates.date = null;
    if (prevStep < 2) updates.serviceId = null;
    if (prevStep < 1 && hasMultipleBarbers) updates.barberId = null;

    updateParams(updates);
  };

  const setStepManual = (newStep: number) => {
    updateParams({ step: newStep.toString() });
  };

  return (
    <div className="space-y-8 w-full max-w-4xl">
      <Card>
        <CardHeader className="flex flex-col justify-center items-center p-6 space-y-4 text-center rounded-lg bg-card">
          {barbershop.image && (
            <div className="overflow-hidden relative w-24 h-24 rounded-full">
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
          <Tabs defaultValue="reservas" className="w-full rounded-lg border">
            <TabsList className="grid grid-cols-2 w-full">
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
                    setStep={setStepManual}
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
