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
import { Separator } from "@/components/ui/separator";

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const services = await prisma.service.findMany({
    where: { barberId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="grid">
          <h1 className="text-2xl font-bold tracking-tight font-heading md:text-3xl">
            Servicios
          </h1>
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
