"use server";

import { getCurrentUser, getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";

type TeamActionState = {
  success?: string | null;
  error?: string | null;
};

type LinkBarberState = {
  success?: string | null;
  error?: string | null;
};

async function generateUniqueConnectionCode(): Promise<string> {
  let code: string;
  let isUnique = false;

  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const existingUser = await prisma.user.findUnique({
      where: { connectionCode: code },
    });
    if (!existingUser) {
      isUnique = true;
    }
  } while (!isUnique);
  return code;
}

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
  const user = await getUserForSettings();

  if (!user || user.role !== Role.OWNER) {
    return { error: "Acción no autorizada. Debes ser dueño de una barbería." };
  }

  const barbershop = user.ownedBarbershop;

  if (!barbershop || !barbershop.slug) {
    return { error: "No se encontró la barbería o su URL asociada." };
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

    await pusherServer.trigger(`user-${barberToLink.id}`, "team-joined", {
      message: "Fuiste agregado a un equipo!",
    });

    revalidatePath("/dashboard/team");
    revalidateTag(`barber-profile:${barbershop.slug}`);
    console.log(
      `[Cache Invalidation] Revalidando tag por nuevo miembro: barber-profile:${barbershop.slug}`
    );

    return { success: `¡${barberToLink.name} ha sido añadido a tu equipo!` };
  } catch (error) {
    console.error("Error al vincular el barbero:", error);
    return {
      error: "Ocurrió un error en la base de datos. Inténtalo de nuevo.",
    };
  }
}

export async function enableTeamFeature(): Promise<TeamActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.OWNER) {
    return { error: "Acción no autorizada." };
  }

  const ownerId = user.id;

  try {
    const updatedBarbershop = await prisma.barbershop.update({
      where: { ownerId },
      data: { teamsEnabled: true },
    });

    if (updatedBarbershop.slug) {
      revalidateTag(`barber-profile:${updatedBarbershop.slug}`);
      console.log(
        `[Cache Invalidation] Revalidando tag por activar equipos: barber-profile:${updatedBarbershop.slug}`
      );
    }

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

export async function removeTeamMember(
  formData: FormData
): Promise<TeamActionState> {
  const user = await getUserForSettings();
  const memberIdToRemove = formData.get("memberId")?.toString();

  if (!user || user.role !== Role.OWNER || !user.ownedBarbershop) {
    return { error: "Acción no autorizada." };
  }
  if (!memberIdToRemove) {
    return { error: "ID de miembro no proporcionado." };
  }
  if (user.id === memberIdToRemove) {
    return { error: "No puedes eliminarte a ti mismo de tu propio equipo." };
  }

  const barbershopId = user.ownedBarbershop.id;

  try {
    const teamMembership = await prisma.team.findFirst({
      where: {
        userId: memberIdToRemove,
        barbershopId: barbershopId,
      },
    });

    if (!teamMembership) {
      return { error: "El miembro no pertenece a tu equipo o no existe." };
    }

    const newConnectionCode = await generateUniqueConnectionCode();

    await prisma.$transaction(async (tx) => {
      await tx.booking.updateMany({
        where: {
          barberId: memberIdToRemove,
          barbershopId: barbershopId,
          startTime: {
            gte: new Date(),
          },
        },
        data: {
          status: "CANCELLED",
        },
      });

      await tx.service.deleteMany({
        where: {
          barberId: memberIdToRemove,
          barbershopId: barbershopId,
        },
      });

      await tx.workingHours.deleteMany({
        where: {
          barberId: memberIdToRemove,
        },
      });

      await tx.timeBlock.deleteMany({
        where: {
          barberId: memberIdToRemove,
          startTime: {
            gte: new Date(),
          },
        },
      });

      await tx.team.delete({
        where: { id: teamMembership.id },
      });

      await tx.user.update({
        where: { id: memberIdToRemove },
        data: { connectionCode: newConnectionCode },
      });
    });

    await pusherServer.trigger(`user-${memberIdToRemove}`, "team-removed", {});

    revalidatePath("/dashboard/team");
    if (user.ownedBarbershop.slug) {
      revalidateTag(`barber-profile:${user.ownedBarbershop.slug}`);
    }

    return { success: "¡Miembro eliminado del equipo con éxito!" };
  } catch (error) {
    console.error("Error al eliminar el miembro del equipo:", error);
    return {
      error: "No se pudo eliminar al miembro. Inténtalo de nuevo más tarde.",
    };
  }
}
