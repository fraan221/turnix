import { Suspense } from "react";
import ClientListSkeleton from "@/components/skeletons/ClientListSkeleton";
import { getCurrentUserWithBarbershop } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Contact, Users } from "lucide-react";
import { Client, Role } from "@prisma/client";
import { Separator } from "@/components/ui/separator";

async function ClientsPageContent() {
  const user = await getCurrentUserWithBarbershop();
  if (!user) return <p>No autorizado</p>;

  const userId = user.id;
  const userRole = user.role;

  let clients: Client[] = [];
  let groupedClients: {
    barberId: string;
    barberName: string;
    clients: Client[];
  }[] = [];
  let teamsEnabled = false;

  const hasClients = clients.length > 0 || groupedClients.length > 0;

  return (
    <div className="mx-auto max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle>
            {userRole === Role.OWNER ? "Todos los Clientes" : "Mis Clientes"}
          </CardTitle>
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
          ) : userRole === Role.OWNER && teamsEnabled ? (
            <div className="space-y-8">
              {groupedClients.map(({ barberId, barberName, clients }) => (
                <div key={barberId}>
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold">
                      {barberName}
                      {barberId === userId && " (Tú)"}
                    </h3>
                    <Separator className="flex-1" />
                  </div>
                  <ClientList clients={clients} />
                </div>
              ))}
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
