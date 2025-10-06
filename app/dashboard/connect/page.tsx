import { getUserForDashboard } from "@/lib/data";
import { ConnectionCodeView } from "@/components/team/ConnectionCodeView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function ConnectPage() {
  const user = await getUserForDashboard();

  if (!user || user.role !== Role.BARBER || user.teamMembership) {
    redirect("/dashboard");
  }

  if (!user?.connectionCode) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>No se pudo generar tu código</AlertTitle>
          <AlertDescription>
            Hubo un problema al crear tu código de conexión. Intentá recargar la
            página o contactá a soporte.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <ConnectionCodeView connectionCode={user.connectionCode} />;
}
