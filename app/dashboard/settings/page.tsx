import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import SettingsForm from "@/components/SettingsForm";
import { notFound } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!user) {
    return notFound();
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Ajustes de Perfil y Barbería</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tu Información</CardTitle>
          <CardDescription>
            Actualiza tu foto de perfil, el nombre de tu barbería y tu URL
            personalizada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
