import { cache, Suspense } from "react";
import ClientListSkeleton from "@/components/skeletons/ClientListSkeleton";
import { getCurrentUserWithBarbershop } from "@/lib/data";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Client, Role } from "@prisma/client";
import { ClientListClient } from "./ClientListClient";

const getClients = cache(async (barbershopId: string, userId: string, role: Role) => {
  if (role === Role.OWNER) {
    return prisma.client.findMany({
      where: {
        barbershopId: barbershopId,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  return prisma.client.findMany({
    where: {
      barbershopId: barbershopId,
      bookings: {
        some: {
          barberId: userId,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
});

async function ClientsPageContent() {
  const user = await getCurrentUserWithBarbershop();
  if (!user || !user.role) return <p>No autorizado</p>;

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;

  if (!barbershopId) {
    return <p>No estás asociado a ninguna barbería.</p>;
  }

  const clients: Client[] = await getClients(barbershopId, user.id, user.role);
  const isOwner = user.role === Role.OWNER;
  const hasClients = clients.length > 0;

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isOwner ? "Clientes de la Barbería" : "Mis Clientes"}</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasClients ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <Users className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 font-semibold">No hay clientes para mostrar</p>
              <p className="text-sm text-muted-foreground">
                {isOwner
                  ? "Los clientes aparecerán aquí después de su primer turno."
                  : "Tus clientes aparecerán aquí después de que los atiendas por primera vez."}
              </p>
            </div>
          ) : (
            <ClientListClient clients={clients} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ClientsPage() {
  return (
    <Suspense fallback={<ClientListSkeleton />}>
      <ClientsPageContent />
    </Suspense>
  );
}
