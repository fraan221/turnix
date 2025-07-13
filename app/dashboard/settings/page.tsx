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

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return <p>Usuario no encontrado.</p>;

  return (
    <>
      <h1 className="flex justify-start mb-2 text-3xl font-bold">Ajustes</h1>
      <div className="flex flex-col items-center justify-center ">
        <Card>
          <CardHeader>
            <CardTitle>Información del perfil</CardTitle>
            <CardDescription>
              Actualiza la foto de perfil de tu barberia y el nombre de tu
              barberia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm user={user} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
