"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ServiceSchema } from "@/lib/schemas";
import { Role } from "@prisma/client";

async function getCurrentUserAndBarbershop() {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, barbershopId: null, error: "No autorizado" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: true,
      teamMembership: true,
    },
  });

  if (!user) {
    return { user: null, barbershopId: null, error: "Usuario no encontrado." };
  }

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;

  if (!barbershopId) {
    return {
      user,
      barbershopId: null,
      error: "Usuario no asociado a una barbería.",
    };
  }

  return { user, barbershopId, error: null };
}

type ServiceInput = z.infer<typeof ServiceSchema>;

export async function createService(data: ServiceInput) {
  const {
    user,
    barbershopId,
    error: authError,
  } = await getCurrentUserAndBarbershop();

  if (authError || !barbershopId) {
    return { error: authError || "No se encontró la barbería." };
  }

  const { name, price, durationInMinutes, description } = data;

  try {
    await prisma.service.create({
      data: {
        name,
        price,
        durationInMinutes,
        description,
        barberId: user!.id,
        barbershopId: barbershopId,
      },
    });
    revalidatePath("/dashboard/services");
    return { success: `Servicio "${name}" creado con éxito.` };
  } catch (error) {
    console.error("Error al crear el servicio:", error);
    return { error: "No se pudo crear el servicio." };
  }
}

export async function updateService(serviceId: string, data: ServiceInput) {
  const {
    user,
    barbershopId,
    error: authError,
  } = await getCurrentUserAndBarbershop();
  if (authError || !user || !barbershopId) {
    return { error: authError || "No se pudo verificar la autorización." };
  }

  const serviceToUpdate = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!serviceToUpdate) {
    return { error: "El servicio que intentas editar no existe." };
  }

  const isDirectOwner = serviceToUpdate.barberId === user.id;
  const isBarbershopOwner =
    user.role === Role.OWNER && serviceToUpdate.barbershopId === barbershopId;

  if (!isDirectOwner && !isBarbershopOwner) {
    return {
      error:
        "Operación no permitida. No tienes permiso para editar este servicio.",
    };
  }

  const { name, price, durationInMinutes, description } = data;

  try {
    await prisma.service.update({
      where: { id: serviceId },
      data: { name, price, durationInMinutes, description },
    });
    revalidatePath("/dashboard/services");
    return { success: `Servicio "${name}" actualizado con éxito.` };
  } catch (error) {
    console.error("Error al actualizar el servicio:", error);
    return { error: "No se pudo actualizar el servicio." };
  }
}

export async function deleteService(serviceId: string) {
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (service?.barberId !== user!.id) {
      return { error: "No tienes permiso para borrar este servicio." };
    }
    await prisma.service.delete({ where: { id: serviceId } });
    revalidatePath("/dashboard/services");
    return { success: "Servicio eliminado con éxito." };
  } catch (error) {
    console.error("Error al eliminar el servicio:", error);
    return { error: "No se pudo eliminar el servicio." };
  }
}
