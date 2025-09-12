import { getCurrentUser } from "@/lib/data";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Editar Bloqueo de Tiempo</CardTitle>
          <CardDescription>
            Ajusta las fechas, horas o la razón de este bloqueo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditTimeBlockForm timeBlock={timeBlock} />
        </CardContent>
      </Card>
    </div>
  );
}
