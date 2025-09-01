import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { AddBarberForm } from "@/components/team/AddBarberForm";
import { EnableTeamView } from "@/components/team/EnableTeamView";
import { TeamList } from "@/components/team/TeamList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default async function TeamPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.OWNER) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertTriangle className="w-4 h-4" />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          No tienes los permisos necesarios para acceder a esta sección.
        </AlertDescription>
      </Alert>
    );
  }

  const barbershop = await prisma.barbershop.findUnique({
    where: { ownerId: session.user.id },
    include: {
      teamMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!barbershop) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertTriangle className="w-4 h-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo encontrar la información de tu barbería.
        </AlertDescription>
      </Alert>
    );
  }

  if (!barbershop.teamsEnabled) {
    return <EnableTeamView />;
  }

  const teamMembers = barbershop.teamMembers.map((member) => member.user);

  return (
    <Card className="mx-auto max-w-7xl">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Barberos</CardTitle>
        <AddBarberForm />
      </CardHeader>
      <CardContent>
        <TeamList teamMembers={teamMembers} />
      </CardContent>
    </Card>
  );
}
