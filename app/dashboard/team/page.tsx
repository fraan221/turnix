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

  if (!barbershop || !barbershop.owner) {
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

  if (!barbershop.teamsEnabled) {
    return <EnableTeamView />;
  }

  const allMembers = [
    barbershop.owner,
    ...barbershop.teamMembers.map((member) => member.user),
  ];

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Barberos</CardTitle>
        <AddBarberForm />
      </CardHeader>
      <CardContent>
        <TeamList teamMembers={allMembers} ownerId={barbershop.ownerId} />
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
