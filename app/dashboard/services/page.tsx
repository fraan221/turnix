// app/dashboard/services/page.tsx
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ServiceForm from "@/components/ServiceForm";
import ServiceList from "@/components/ServiceList"; 

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const services = await prisma.service.findMany({
    where: { barberId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Servicios</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Añadir Servicio</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceForm />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mis Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceList services={services} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}