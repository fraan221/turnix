import { getUserForDashboard } from "@/lib/data";
import { ConnectionCodeView } from "@/components/team/ConnectionCodeView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserCheck } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function ConnectPage() {
  const user = await getUserForDashboard();

  if (!user || user.role !== Role.BARBER || user.teamMembership) {
    redirect("/dashboard");
  }

  if (!user?.connectionCode) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="default" className="max-w-md">
          <UserCheck className="w-4 h-4" />
          <AlertTitle>¡Ya estás conectado!</AlertTitle>
          <AlertDescription>
            Parece que ya formas parte de un equipo. Refresca la página o vuelve
            al inicio del dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <ConnectionCodeView connectionCode={user.connectionCode} />;
}
