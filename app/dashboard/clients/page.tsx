import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Contact } from "lucide-react";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const clients = await prisma.client.findMany({
    where: {
      bookings: {
        some: {
          barberId: session.user.id,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight font-heading md:text-3xl">
        Clientes
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p>Aún no tienes clientes registrados.</p>
          ) : (
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
                    <Button variant="outline" size="sm">
                      <Contact className="w-4 h-4" />
                      Ficha
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
