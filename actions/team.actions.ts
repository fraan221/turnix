"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type TeamActionState = {
  success?: string | null;
  error?: string | null;
};

type LinkBarberState = {
  success?: string | null;
  error?: string | null;
};

const LinkBarberSchema = z.object({
  connectionCode: z
    .string()
    .trim()
    .min(6, { message: "El código debe tener 6 caracteres." })
    .max(6, { message: "El código debe tener 6 caracteres." }),
});

export async function linkBarberToShop(
  prevState: LinkBarberState,
  formData: FormData
): Promise<LinkBarberState> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.OWNER) {
    return { error: "Acción no autorizada. Debes ser dueño de una barbería." };
  }

  const ownerId = session.user.id;

  const barbershop = await prisma.barbershop.findUnique({
    where: { ownerId },
  });

  if (!barbershop) {
    return { error: "No se encontró la barbería asociada a tu cuenta." };
  }

  const validatedFields = LinkBarberSchema.safeParse({
    connectionCode: formData.get("connectionCode"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.connectionCode?.[0],
    };
  }

  const { connectionCode } = validatedFields.data;

  const barberToLink = await prisma.user.findUnique({
    where: { connectionCode },
  });

  if (!barberToLink) {
    return { error: "El código de conexión no es válido o no existe." };
  }

  if (barberToLink.role !== Role.BARBER) {
    return { error: "El código proporcionado no pertenece a un barbero." };
  }

  const existingTeamMembership = await prisma.team.findUnique({
    where: { userId: barberToLink.id },
  });

  if (existingTeamMembership) {
    return { error: "Este barbero ya pertenece a un equipo." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.team.create({
        data: {
          barbershopId: barbershop.id,
          userId: barberToLink.id,
        },
      });

      await tx.user.update({
        where: { id: barberToLink.id },
        data: { connectionCode: null },
      });
    });

    revalidatePath("/dashboard/team");
    return { success: `¡${barberToLink.name} ha sido añadido a tu equipo!` };
  } catch (error) {
    console.error("Error al vincular el barbero:", error);
    return {
      error: "Ocurrió un error en la base de datos. Inténtalo de nuevo.",
    };
  }
}

export async function enableTeamFeature(): Promise<TeamActionState> {
  // 1. Autenticación y Autorización
  const session = await auth();
  if (!session?.user?.id || session.user.role !== Role.OWNER) {
    return { error: "Acción no autorizada." };
  }

  const ownerId = session.user.id;

  // 2. Lógica de Negocio
  try {
    await prisma.barbershop.update({
      where: { ownerId },
      data: { teamsEnabled: true },
    });

    // 3. Revalidación y Respuesta
    revalidatePath("/dashboard/team");
    return { success: "¡La gestión de equipos ha sido activada!" };
  } catch (error) {
    console.error("Error al activar la función de equipos:", error);
    return {
      error:
        "No se pudo activar la gestión de equipos. Inténtalo de nuevo más tarde.",
    };
  }
}
