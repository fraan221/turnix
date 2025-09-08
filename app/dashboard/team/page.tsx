import { Suspense } from "react";
import TeamListSkeleton from "@/components/skeletons/TeamListSkeleton";
import { getTeamPageData } from "@/lib/data";
import { AddBarberForm } from "@/components/team/AddBarberForm";
import { EnableTeamView } from "@/components/team/EnableTeamView";
import { TeamList } from "@/components/team/TeamList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

async function TeamPageContent() {
  const barbershop = await getTeamPageData();

  if (!barbershop) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertTriangle className="w-4 h-4" />
        <AlertTitle>Acceso Denegado o Error</AlertTitle>
        <AlertDescription>
          No tienes permisos o no se encontró tu barbería.
        </AlertDescription>
      </Alert>
    );
  }

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

export default async function TeamPage() {
  return (
    <Suspense fallback={<TeamListSkeleton />}>
      <TeamPageContent />
    </Suspense>
  );
}
