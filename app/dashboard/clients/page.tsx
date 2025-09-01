import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Contact, Users } from "lucide-react";
import { Client, Role } from "@prisma/client";
import { Separator } from "@/components/ui/separator";

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
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const userId = session.user.id;
  const userRole = session.user.role;
  let clients: Client[] = [];
  let groupedClients: {
    barberId: string;
    barberName: string;
    clients: Client[];
  }[] = [];
  let teamsEnabled = false;

  if (userRole === Role.OWNER) {
    const barbershop = await prisma.barbershop.findUnique({
      where: { ownerId: userId },
      select: { id: true, teamsEnabled: true },
    });

    if (barbershop) {
      teamsEnabled = barbershop.teamsEnabled;
      const allClientsInShop = await prisma.client.findMany({
        where: { barbershopId: barbershop.id },
        include: {
          bookings: {
            distinct: ["barberId"],
            select: {
              barber: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      if (teamsEnabled) {
        const clientsByBarber = new Map<
          string,
          { barberName: string; clients: Client[] }
        >();

        for (const client of allClientsInShop) {
          if (client.bookings.length > 0) {
            for (const booking of client.bookings) {
              const { barber } = booking;
              if (!clientsByBarber.has(barber.id)) {
                clientsByBarber.set(barber.id, {
                  barberName: barber.name || "Sin nombre",
                  clients: [],
                });
              }
              if (
                !clientsByBarber
                  .get(barber.id)!
                  .clients.some((c) => c.id === client.id)
              ) {
                clientsByBarber.get(barber.id)!.clients.push(client);
              }
            }
          }
        }

        const ownerGroupData = clientsByBarber.get(userId);
        clientsByBarber.delete(userId);
        const teamGroupsData = Array.from(clientsByBarber.entries()).map(
          ([id, data]) => ({ barberId: id, ...data })
        );

        groupedClients = ownerGroupData
          ? [{ barberId: userId, ...ownerGroupData }, ...teamGroupsData]
          : teamGroupsData;
      } else {
        clients = allClientsInShop;
      }
    }
  } else {
    clients = await prisma.client.findMany({
      where: {
        bookings: {
          some: {
            barberId: userId,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

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
