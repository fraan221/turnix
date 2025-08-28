import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import EditServiceForm from "@/components/EditServiceForm";
import { Role } from "@prisma/client";

interface EditServicePageProps {
  params: { serviceId: string };
}

export default async function EditServicePage({
  params,
}: EditServicePageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return notFound();
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: true,
      teamMembership: true,
    },
  });

  const barbershopId =
    currentUser?.ownedBarbershop?.id ||
    currentUser?.teamMembership?.barbershopId;

  if (!barbershopId) {
    return notFound();
  }

  const service = await prisma.service.findUnique({
    where: {
      id: params.serviceId,
    },
  });

  if (!service || service.barbershopId !== barbershopId) {
    return notFound();
  }

  if (currentUser.role === Role.BARBER && service.barberId !== currentUser.id) {
    return notFound();
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Editar Servicio</CardTitle>
          <CardDescription>
            Realiza los cambios necesarios y haz clic en guardar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditServiceForm service={service} />
        </CardContent>
      </Card>
    </div>
  );
}
