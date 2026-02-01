import { Suspense } from "react";
import SettingsFormSkeleton from "@/components/skeletons/SettingsFormSkeleton";
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

  const ownedBarbershop = userWithRelations.ownedBarbershop;
  const userForForm = {
    ...userWithRelations,
    barbershop: barbershopData
      ? {
          ...barbershopData,
          ...(ownedBarbershop && userWithRelations.role === Role.OWNER
            ? {
                depositEnabled: ownedBarbershop.depositEnabled,
                depositAmountType: ownedBarbershop.depositAmountType,
                depositAmount: ownedBarbershop.depositAmount,
                mpCredentials: ownedBarbershop.mpCredentials,
              }
            : {}),
        }
      : null,
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Configuración
        </h1>
        <p className="mt-1 text-muted-foreground">
          Gestioná tu perfil, tu barbería y preferencias de la cuenta.
        </p>
      </div>
      <SettingsForm
        user={userForForm}
        subscription={userWithRelations.subscription}
        trialEndsAt={userWithRelations.trialEndsAt}
      />
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
