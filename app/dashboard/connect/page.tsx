import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ConnectionCodeView } from "@/components/team/ConnectionCodeView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, UserCheck } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function ConnectPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.BARBER) {
    redirect("/dashboard");
  }

  if (session.user.teamMembership) {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { connectionCode: true },
  });

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
