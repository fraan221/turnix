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
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Lista de Servicios
            <AddServiceModal />
          </CardTitle>
          <CardDescription className="sr-only">
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
