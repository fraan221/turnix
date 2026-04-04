import { getCurrentUser } from "@/lib/data";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditTimeBlockForm from "@/components/EditTimeBlockForm";

interface EditTimeBlockPageProps {
  params: { blockId: string };
  searchParams?: { barberId?: string };
}

export default async function EditTimeBlockPage({
  params,
  searchParams,
}: EditTimeBlockPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return notFound();
  }

  const timeBlock = await prisma.timeBlock.findUnique({
    where: {
      id: params.blockId,
    },
  });

  if (!timeBlock) {
    return notFound();
  }

  if (timeBlock.barberId !== user.id) {
    if (user.role !== Role.OWNER) {
      return notFound();
    }

    const canManageBarber = await prisma.team.findFirst({
      where: {
        userId: timeBlock.barberId,
        barbershop: { ownerId: user.id },
      },
      select: { id: true },
    });

    if (!canManageBarber) {
      return notFound();
    }
  }

  const selectedBarberId = searchParams?.barberId ?? timeBlock.barberId;
  const returnHref = `/dashboard/schedule?barberId=${selectedBarberId}`;

  return (
    <div className="container max-w-2xl px-4 py-6 mx-auto sm:px-6 sm:py-8">
      <EditTimeBlockForm timeBlock={timeBlock} returnHref={returnHref} />
    </div>
  );
}
