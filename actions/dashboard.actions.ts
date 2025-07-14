"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

// Services - Create, Update & Delete
export async function createService(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const name = formData.get("name")?.toString();
  const priceStr = formData.get("price")?.toString();
  const durationStr = formData.get("duration")?.toString();
  const description = formData.get("description")?.toString() || null;

  if (!name || !priceStr) {
    return { error: "El nombre y el precio son requeridos." };
  }

  const price = parseFloat(priceStr);
  if (isNaN(price) || price <= 0) {
    return { error: "El precio debe ser un número válido y mayor a cero." };
  }

  let durationInMinutes: number | null = null;
  if (durationStr) {
    const duration = parseInt(durationStr, 10);
    if (!isNaN(duration) && duration > 0) {
      durationInMinutes = duration;
    } else {
      return {
        error:
          "Si se especifica, la duración debe ser un número entero positivo.",
      };
    }
  }

  try {
    await prisma.service.create({
      data: {
        name,
        price,
        durationInMinutes,
        description,
        barberId: session.user.id,
      },
    });
    revalidatePath("/dashboard/services");
    return { success: `Servicio "${name}" creado con éxito.` };
  } catch (error) {
    return { error: "No se pudo crear el servicio." };
  }
}

export async function updateService(
  serviceId: string,
  prevState: any,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const serviceToUpdate = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!serviceToUpdate || serviceToUpdate.barberId !== session.user.id) {
    return { error: "Operación no permitida." };
  }

  const name = formData.get("name")?.toString();
  const priceStr = formData.get("price")?.toString();
  const durationStr = formData.get("duration")?.toString();
  const description = formData.get("description")?.toString() || null;

  if (!name || !priceStr) {
    return { error: "El nombre y el precio son requeridos." };
  }

  const price = parseFloat(priceStr);
  if (isNaN(price) || price <= 0) {
    return { error: "El precio debe ser un número válido y mayor a cero." };
  }

  let durationInMinutes: number | null = null;
  if (durationStr) {
    const duration = parseInt(durationStr, 10);
    if (!isNaN(duration) && duration > 0) {
      durationInMinutes = duration;
    } else {
      return {
        error:
          "Si se especifica, la duración debe ser un número entero positivo.",
      };
    }
  }

  try {
    await prisma.service.update({
      where: { id: serviceId },
      data: { name, price, durationInMinutes, description },
    });

    revalidatePath("/dashboard/services");
    return { success: `Servicio "${name}" actualizado con éxito.` };
  } catch (error) {
    return { error: "No se pudo actualizar el servicio." };
  }
}

export async function deleteService(serviceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (service?.barberId !== session.user.id) {
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

export async function updateWorkingHours(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  try {
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const isWorking = formData.get(`${day}-isWorking`) === "on";
      const startTime = formData.get(`${day}-startTime`)?.toString() || "09:00";
      const endTime = formData.get(`${day}-endTime`)?.toString() || "18:00";

      await prisma.workingHours.upsert({
        where: {
          barberId_dayOfWeek: { barberId: session.user.id, dayOfWeek: i },
        },
        update: { isWorking, startTime, endTime },
        create: {
          barberId: session.user.id,
          dayOfWeek: i,
          isWorking,
          startTime,
          endTime,
        },
      });
    }
    revalidatePath("/dashboard/schedule");
    return { success: "Horario semanal guardado con éxito." };
  } catch (error) {
    return { error: "No se pudo guardar el horario." };
  }
}

type DaySchedule = {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
};

export async function saveSchedule(schedule: DaySchedule[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  const barberId = session.user.id;

  try {
    await prisma.$transaction(
      schedule.map((day) =>
        prisma.workingHours.upsert({
          where: {
            barberId_dayOfWeek: {
              barberId: barberId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            isWorking: day.isWorking,
            startTime: day.startTime,
            endTime: day.endTime,
          },
          create: {
            barberId: barberId,
            dayOfWeek: day.dayOfWeek,
            isWorking: day.isWorking,
            startTime: day.startTime,
            endTime: day.endTime,
          },
        })
      )
    );

    revalidatePath("/dashboard/schedule");
    return { success: "¡Horario guardado con éxito!" };
  } catch (error) {
    console.error("Error al guardar el horario:", error);
    return { error: "No se pudo guardar el horario." };
  }
}

// Time Block - Create, Update & Delete
export async function createTimeBlock(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const startDate = formData.get("startDate")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endDate = formData.get("endDate")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const reason = formData.get("reason")?.toString();

  if (!startDate || !startTime || !endDate || !endTime) {
    return { error: "Fechas y horas de inicio y fin son requeridas." };
  }

  try {
    const startDateTime = new Date(`${startDate}T${startTime}:00-03:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00-03:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return { error: "Formato de fecha u hora inválido." };
    }

    await prisma.timeBlock.create({
      data: {
        startTime: startDateTime,
        endTime: endDateTime,
        reason: reason,
        barberId: session.user.id,
      },
    });
    revalidatePath("/dashboard/schedule");
    return { success: "Bloqueo de tiempo creado con éxito." };
  } catch (error) {
    return { error: "No se pudo crear el bloqueo." };
  }
}

export async function updateTimeBlock(
  blockId: string,
  prevState: any,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const blockToUpdate = await prisma.timeBlock.findUnique({
    where: { id: blockId },
  });

  if (!blockToUpdate || blockToUpdate.barberId !== session.user.id) {
    return { error: "Operación no permitida." };
  }

  const startDate = formData.get("startDate")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endDate = formData.get("endDate")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const reason = formData.get("reason")?.toString() || null;

  if (!startDate || !startTime || !endDate || !endTime) {
    return { error: "Fechas y horas de inicio y fin son requeridas." };
  }

  try {
    const startDateTime = new Date(`${startDate}T${startTime}:00-03:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00-03:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return { error: "Formato de fecha u hora inválido." };
    }

    await prisma.timeBlock.update({
      where: { id: blockId },
      data: { startTime: startDateTime, endTime: endDateTime, reason },
    });

    revalidatePath("/dashboard/schedule");
    return { success: "Bloqueo actualizado con éxito." };
  } catch (error) {
    return { error: "No se pudo actualizar el bloqueo." };
  }
}

export async function deleteTimeBlock(blockId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  try {
    const block = await prisma.timeBlock.findUnique({
      where: { id: blockId },
    });

    if (block?.barberId !== session.user.id) {
      return { error: "No tienes permiso para borrar este bloqueo." };
    }

    await prisma.timeBlock.delete({
      where: { id: blockId },
    });

    revalidatePath("/dashboard/schedule");
    return { success: "Bloqueo eliminado con éxito." };
  } catch (error) {
    console.error("Error al eliminar el bloqueo:", error);
    return { error: "No se pudo eliminar el bloqueo." };
  }
}

export async function updateClientNotes(clientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const notes = formData.get("notes")?.toString();

  await prisma.client.update({
    where: { id: clientId },
    data: {
      notes: notes,
    },
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function createBooking(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const serviceId = formData.get("serviceId")?.toString();
  const clientName = formData.get("clientName")?.toString();
  const clientPhone = formData.get("clientPhone")?.toString();
  const startTimeStr = formData.get("startTime")?.toString();

  if (!serviceId || !clientName || !clientPhone || !startTimeStr) {
    throw new Error("Todos los campos son requeridos para crear el turno.");
  }

  const startTime = new Date(startTimeStr);

  const client = await prisma.client.upsert({
    where: { phone: clientPhone },
    update: { name: clientName },
    create: { name: clientName, phone: clientPhone },
  });

  await prisma.booking.create({
    data: {
      startTime,
      barberId: session.user.id,
      clientId: client.id,
      serviceId: serviceId,
    },
  });

  revalidatePath("/dashboard");
}

export async function updateUserProfile(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  const barbershopName = formData.get("barbershopName")?.toString();
  let slug = formData.get("slug")?.toString();
  const avatarFile = formData.get("avatar") as File;
  let avatarUrl: string | undefined = undefined;

  if (avatarFile && avatarFile.size > 0) {
    try {
      const blob = await put(avatarFile.name, avatarFile, {
        access: "public",
        addRandomSuffix: true,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      });
      avatarUrl = blob.url;
    } catch (error) {
      console.error("Error al subir el avatar:", error);
      return { error: "No se pudo subir la imagen. Inténtalo de nuevo." };
    }
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.slug) {
    if (!slug) {
      return { error: "La URL personalizada es requerida." };
    }
    slug = slug
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const existingSlug = await prisma.user.findFirst({
      where: { slug: slug, id: { not: session.user.id } },
    });
    if (existingSlug) {
      return {
        error: "Esa URL personalizada ya está en uso. Por favor, elige otra.",
      };
    }
  } else {
    slug = user.slug;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        barbershopName,
        slug,
        ...(avatarUrl && { image: avatarUrl }),
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return {
      success: "¡Perfil actualizado con éxito!",
      newImageUrl: updatedUser.image,
      newSlug: updatedUser.slug,
    };
  } catch (error) {
    return { error: "No se pudo actualizar el perfil." };
  }
}

export async function completeOnboarding() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    revalidatePath("/dashboard");
    return { success: "¡Onboarding completado!" };
  } catch (error) {
    return { error: "No se pudo completar el onboarding." };
  }
}
