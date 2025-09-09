import { Suspense } from "react";
import ClientListSkeleton from "@/components/skeletons/ClientListSkeleton";
import { getCurrentUserWithBarbershop } from "@/lib/data";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Contact, Users } from "lucide-react";
import { Client, Role } from "@prisma/client";
import { Separator } from "@/components/ui/separator";

async function ClientsPageContent() {
  const user = await getCurrentUserWithBarbershop();
  if (!user) return <p>No autorizado</p>;

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;

  if (!barbershopId) {
    return <p>No estás asociado a ninguna barbería.</p>;
  }

  const clients: Client[] = await prisma.client.findMany({
    where: {
      barbershopId: barbershopId,
    },
    orderBy: {
      name: "asc",
    },
  });

  const hasClients = clients.length > 0;

  return (
    <div className="mx-auto max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle>Clientes de la Barbería</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasClients ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <Users className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 font-semibold">No hay clientes para mostrar</p>
              <p className="text-sm text-muted-foreground">
                Los clientes aparecerán aquí después de su primer turno.
              </p>
            </div>
          ) : (
            <ClientList clients={clients} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClientList({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay clientes en esta sección.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {clients.map((client) => (
        <div
          key={client.id}
          className="flex items-center justify-between p-4 border rounded-md"
        >
          <div>
            <p className="font-semibold">{client.name}</p>
            <p className="text-sm text-gray-500">{client.phone}</p>
          </div>
          <Link href={`/dashboard/clients/${client.id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Contact className="w-4 h-4" />
              Ficha
            </Button>
          </Link>
        </div>
      ))}
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
