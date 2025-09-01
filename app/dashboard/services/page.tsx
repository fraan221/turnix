import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ServiceList from "@/components/ServiceList";
import AddServiceModal from "@/components/AddServiceModal";
import { Prisma, Role, Service } from "@prisma/client";
import { Separator } from "@/components/ui/separator";

const serviceWithBarber = Prisma.validator<Prisma.ServiceDefaultArgs>()({
  include: { barber: { select: { id: true, name: true } } },
});
type ServiceWithBarber = Prisma.ServiceGetPayload<typeof serviceWithBarber>;

type GroupedService = {
  barberId: string;
  barberName: string;
  services: Service[];
};

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const userId = session.user.id;
  const userRole = session.user.role;
  let services: Service[] = [];
  let groupedServices: GroupedService[] = [];
  let teamsEnabled = false;

  if (userRole === Role.OWNER) {
    const barbershop = await prisma.barbershop.findUnique({
      where: { ownerId: userId },
      include: {
        services: {
          include: {
            barber: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

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

  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Lista de Servicios</CardTitle>
          <AddServiceModal />
        </CardHeader>
        <CardContent>
          {userRole === Role.OWNER && teamsEnabled ? (
            <div className="space-y-8">
              {groupedServices.map(({ barberId, barberName, services }) => (
                <div key={barberId}>
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold">
                      {barberName}
                      {barberId === userId && " (Tú)"}
                    </h3>
                    <Separator className="flex-1" />
                  </div>
                  <ServiceList services={services} />
                </div>
              ))}
            </div>
          ) : (
            <ServiceList services={services} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
