import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ServiceList from "@/components/ServiceList";
import AddServiceModal from "@/components/AddServiceModal";

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const services = await prisma.service.findMany({
    where: { barberId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Servicios
          </h1>
          <p className="text-muted-foreground">
            Añade, edita y gestiona los servicios que ofreces.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <AddServiceModal />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Servicios</CardTitle>
          <CardDescription>
            {services.length > 0
              ? `Actualmente tienes ${services.length} servicios cargados.`
              : "Aún no has añadido ningún servicio. ¡Crea el primero!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceList services={services} />
        </CardContent>
      </Card>
    </div>
  );
}
