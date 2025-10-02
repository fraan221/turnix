import { Suspense } from "react";
import SettingsFormSkeleton from "@/components/skeletons/SettingsFormSkeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import SettingsForm from "@/components/SettingsForm";
import { notFound } from "next/navigation";
import { getUserForSettings } from "@/lib/data";
import { Role } from "@prisma/client";

async function SettingsPageContent() {
  const userWithRelations = await getUserForSettings();

  if (!userWithRelations) {
    notFound();
  }

  const barbershopData =
    userWithRelations.role === Role.OWNER
      ? userWithRelations.ownedBarbershop
      : userWithRelations.teamMembership?.barbershop || null;

  const userForForm = {
    ...userWithRelations,
    barbershop: barbershopData,
  };

  return (
    <div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Información del Perfil y Barbería</CardTitle>
          <CardDescription>
            Actualiza tu foto, tu nombre y los datos de tu barbería.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm user={userForForm} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFormSkeleton />}>
      <SettingsPageContent />
    </Suspense>
  );
}
