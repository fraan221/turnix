import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import EditServiceForm from "@/components/EditServiceForm";

interface EditServicePageProps {
  params: { serviceId: string };
}

export default async function EditServicePage({
  params,
}: EditServicePageProps) {
  const currentUser = await getUserForSettings();
  if (!currentUser) {
    return notFound();
  }

  const barbershopId =
    currentUser.ownedBarbershop?.id || currentUser.teamMembership?.barbershopId;

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
    <div className="w-full max-w-3xl px-4 py-6 mx-auto sm:px-6 sm:py-8">
      <EditServiceForm service={service} />
    </div>
  );
}
