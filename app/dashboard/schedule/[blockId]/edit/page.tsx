import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditTimeBlockForm from "@/components/EditTimeBlockForm";

interface EditTimeBlockPageProps {
  params: { blockId: string };
}

export default async function EditTimeBlockPage({
  params,
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
    return notFound();
  }

  return (
    <div className="container max-w-2xl px-4 py-6 mx-auto sm:px-6 sm:py-8">
      <EditTimeBlockForm timeBlock={timeBlock} />
    </div>
  );
}
