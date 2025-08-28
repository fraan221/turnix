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
import { Role } from "@prisma/client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return notFound();

  const userWithRelations = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: {
        select: {
          name: true,
          slug: true,
        },
      },
      teamMembership: {
        include: {
          barbershop: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!userWithRelations) return notFound();

  const user = {
    ...userWithRelations,
    barbershop:
      userWithRelations.role === Role.OWNER
        ? userWithRelations.ownedBarbershop
        : userWithRelations.teamMembership?.barbershop || null,
  };

  return (
    <div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Información del Perfil y Barbería</CardTitle>
          <CardDescription className="sr-only">
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
