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
  if (!session?.user?.id) return notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      barbershop: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!user) return notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight font-heading md:text-3xl">
        Ajustes
      </h1>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Información del Perfil y Barbería</CardTitle>
          <CardDescription>
            Actualiza tu foto, tu nombre y los datos de tu barbería.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
