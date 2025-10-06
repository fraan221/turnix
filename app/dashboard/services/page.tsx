import { Suspense } from "react";
import { getCurrentUserWithBarbershop } from "@/lib/data";
import prisma from "@/lib/prisma";
import { Prisma, Role, Service } from "@prisma/client";
import ServiceListSkeleton from "@/components/skeletons/ServiceListSkeleton";
import { ServicesClient } from "./services-client";

const serviceWithBarber = Prisma.validator<Prisma.ServiceDefaultArgs>()({
  include: { barber: { select: { id: true, name: true } } },
});
type ServiceWithBarber = Prisma.ServiceGetPayload<typeof serviceWithBarber>;

export type GroupedService = {
  barberId: string;
  barberName: string;
  services: Service[];
};

async function getServicesData() {
  const user = await getCurrentUserWithBarbershop();
  if (!user) {
    throw new Error("No autorizado");
  }

  const userId = user.id;
  const userRole = user.role;

  let services: Service[] = [];
  let groupedServices: GroupedService[] = [];
  let teamsEnabled = false;

  if (userRole === Role.OWNER) {
    const barbershopInfo = user.ownedBarbershop;
    const barbershop = barbershopInfo
      ? await prisma.barbershop.findUnique({
          where: { id: barbershopInfo.id },
          include: {
            services: {
              include: { barber: { select: { id: true, name: true } } },
              orderBy: { name: "asc" },
            },
          },
        })
      : null;

    if (barbershop) {
      teamsEnabled = barbershop.teamsEnabled;
      const allServices: ServiceWithBarber[] = barbershop.services;

      if (teamsEnabled) {
        const servicesByBarber = new Map<string, GroupedService>();
        for (const service of allServices) {
          const { barber } = service;
          if (!servicesByBarber.has(barber.id)) {
            servicesByBarber.set(barber.id, {
              barberId: barber.id,
              barberName: barber.name || "Sin nombre",
              services: [],
            });
          }
          servicesByBarber.get(barber.id)!.services.push(service);
        }
        const ownerGroup = servicesByBarber.get(userId);
        servicesByBarber.delete(userId);
        const teamGroups = Array.from(servicesByBarber.values());
        groupedServices = ownerGroup ? [ownerGroup, ...teamGroups] : teamGroups;
      } else {
        services = barbershop.services;
      }
    }
  } else {
    services = await prisma.service.findMany({
      where: { barberId: userId },
      orderBy: { name: "asc" },
    });
  }

  return { user, services, groupedServices, teamsEnabled };
}

export default async function ServicesPage() {
  const data = await getServicesData();

  if (!data.user.role) {
    throw new Error(
      "El usuario no tiene un rol asignado y no puede ver esta página."
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Suspense fallback={<ServiceListSkeleton />}>
        <ServicesClient
          userId={data.user.id}
          userRole={data.user.role}
          initialServices={data.services}
          initialGroupedServices={data.groupedServices}
          teamsEnabled={data.teamsEnabled}
        />
      </Suspense>
    </div>
  );
}
