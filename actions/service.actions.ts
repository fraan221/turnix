"use server";

import { getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { ServiceSchema } from "@/lib/schemas";
import { Role } from "@prisma/client";

type ServiceInput = z.infer<typeof ServiceSchema>;

export async function createService(data: ServiceInput) {
  const user = await getUserForSettings();
  if (!user) {
    return { error: "No autorizado." };
  }

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;

  const barbershopSlug =
    user.ownedBarbershop?.slug || user.teamMembership?.barbershop.slug;

  if (!barbershopId || !barbershopSlug) {
    return { error: "Usuario no asociado a una barbería." };
  }

  const { name, price, durationInMinutes, description } = data;

  try {
    await prisma.service.create({
      data: {
        name,
        price,
        durationInMinutes,
        description,
        barberId: user.id,
        barbershopId: barbershopId,
      },
    });

    revalidatePath("/dashboard/services");
    revalidateTag(`barber-profile:${barbershopSlug}`);
    console.log(
      `[Cache Invalidation] Revalidando tag por nuevo servicio: barber-profile:${barbershopSlug}`
    );

    return { success: `Servicio "${name}" creado con éxito.` };
  } catch (error) {
    console.error("Error al crear el servicio:", error);
    return { error: "No se pudo crear el servicio." };
  }
}

export async function updateService(serviceId: string, data: ServiceInput) {
  const user = await getUserForSettings();

  if (!user) {
    return { error: "No se pudo verificar la autorización." };
  }

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;
  if (!barbershopId) {
    return { error: "Usuario no asociado a una barbería." };
  }

  const serviceToUpdate = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      barbershop: {
        select: { slug: true },
      },
    },
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
    // 2. Invalidamos el caché del perfil público
    const barbershopSlug = serviceToUpdate.barbershop.slug;
    if (barbershopSlug) {
      revalidateTag(`barber-profile:${barbershopSlug}`);
      console.log(
        `[Cache Invalidation] Revalidando tag por actualización de servicio: barber-profile:${barbershopSlug}`
      );
    }

    return { success: `Servicio "${name}" actualizado con éxito.` };
  } catch (error) {
    console.error("Error al actualizar el servicio:", error);
    return { error: "No se pudo actualizar el servicio." };
  }
}

export async function deleteService(serviceId: string) {
  const user = await getUserForSettings();
  if (!user) {
    return { error: "No autorizado" };
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        barbershop: {
          select: { slug: true, ownerId: true },
        },
      },
    });

    if (!service) {
      return { error: "Servicio no encontrado." };
    }
    const isOwnerOfBarbershop =
      user.role === Role.OWNER && user.id === service.barbershop.ownerId;
    const isOwnerOfService = service.barberId === user.id;

    if (!isOwnerOfBarbershop && !isOwnerOfService) {
      return { error: "No tienes permiso para borrar este servicio." };
    }

    await prisma.service.delete({ where: { id: serviceId } });

    revalidatePath("/dashboard/services");
    const barbershopSlug = service.barbershop.slug;
    if (barbershopSlug) {
      revalidateTag(`barber-profile:${barbershopSlug}`);
      console.log(
        `[Cache Invalidation] Revalidando tag por eliminación de servicio: barber-profile:${barbershopSlug}`
      );
    }

    return { success: "Servicio eliminado con éxito." };
  } catch (error) {
    console.error("Error al eliminar el servicio:", error);
    return { error: "No se pudo eliminar el servicio." };
  }
}
