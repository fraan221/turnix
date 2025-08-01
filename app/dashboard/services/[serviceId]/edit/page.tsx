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

  const service = await prisma.service.findUnique({
    where: {
      id: params.serviceId,
    },
  });

  if (!service) {
    return notFound();
  }

  if (service.barberId !== session.user.id) {
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
