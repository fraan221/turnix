import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return <p>No autorizado</p>;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return <p>Usuario no encontrado.</p>;

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Ajustes de Perfil y Barbería</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tu Información</CardTitle>
          <CardDescription>
            Actualiza tu nombre, el de tu barbería y tu URL personalizada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}