"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { BookingStatus } from "@prisma/client";

async function getCurrentUserAndBarbershop() {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, barbershopId: null, error: "No autorizado" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, barbershopId: true },
  });

  if (!user || !user.barbershopId) {
    return {
      user: null,
      barbershopId: null,
      error: "Usuario no encontrado o no asociado a una barbería.",
    };
  }

  return { user, barbershopId: user.barbershopId, error: null };
}

// Services - Create, Update & Delete
export async function createService(prevState: any, formData: FormData) {
  const { user, barbershopId, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

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
        barberId: user!.id,
        barbershopId: barbershopId!,
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
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  const serviceToUpdate = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!serviceToUpdate || serviceToUpdate.barberId !== user!.id) {
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

export async function updateWorkingHours(prevState: any, formData: FormData) {
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  try {
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const isWorking = formData.get(`${day}-isWorking`) === "on";
      const startTime = formData.get(`${day}-startTime`)?.toString() || "09:00";
      const endTime = formData.get(`${day}-endTime`)?.toString() || "18:00";

      await prisma.workingHours.upsert({
        where: {
          barberId_dayOfWeek: { barberId: user!.id, dayOfWeek: i },
        },
        update: { isWorking, startTime, endTime },
        create: {
          barberId: user!.id,
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
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  const barberId = user!.id;

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
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

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
        barberId: user!.id,
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
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  const blockToUpdate = await prisma.timeBlock.findUnique({
    where: { id: blockId },
  });

  if (!blockToUpdate || blockToUpdate.barberId !== user!.id) {
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
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  try {
    const block = await prisma.timeBlock.findUnique({
      where: { id: blockId },
    });

    if (block?.barberId !== user!.id) {
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
  if (!session?.user?.id) {
    console.error("Error: No autorizado para actualizar notas de cliente.");
    return;
  }

  const notes = formData.get("notes")?.toString();

  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        bookings: {
          some: {
            barberId: session.user.id,
          },
        },
      },
    });

    if (!client) {
      console.error("Error: Cliente no encontrado o no pertenece al usuario.");
      return;
    }

    await prisma.client.update({
      where: { id: clientId },
      data: {
        notes: notes,
      },
    });

    revalidatePath(`/dashboard/clients/${clientId}`);
  } catch (error) {
    console.error("Error al actualizar las notas del cliente:", error);
  }
}

export async function createBooking(formData: FormData) {
  const { user, barbershopId, error } = await getCurrentUserAndBarbershop();
  if (error) throw new Error(error);

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
    create: {
      name: clientName,
      phone: clientPhone,
      barbershopId: barbershopId!,
    },
  });

  await prisma.booking.create({
    data: {
      startTime,
      barberId: user!.id,
      clientId: client.id,
      serviceId: serviceId,
      barbershopId: barbershopId!,
    },
  });

  revalidatePath("/dashboard");
}

export async function updateUserProfile(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  const userId = session.user.id;
  const name = formData.get("name")?.toString();
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

  if (!name || !barbershopName || !slug) {
    return {
      error: "El nombre, el nombre de la barbería y la URL son requeridos.",
    };
  }

  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    return {
      error:
        "Formato de URL no válido. Usa solo minúsculas, números y guiones (ej: mi-barberia).",
    };
  }

  const existingBarbershopWithSlug = await prisma.barbershop.findFirst({
    where: {
      slug: slug,
      ownerId: { not: userId },
    },
  });

  if (existingBarbershopWithSlug) {
    return {
      error: "Esa URL personalizada ya está en uso. Por favor, elige otra.",
    };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        ...(avatarUrl && { image: avatarUrl }),
      },
    });

    const barbershop = await prisma.barbershop.upsert({
      where: { ownerId: userId },
      update: {
        name: barbershopName,
        slug,
      },
      create: {
        name: barbershopName,
        slug,
        owner: {
          connect: { id: userId },
        },
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath(`/${barbershop.slug}`);

    return {
      success: "¡Perfil actualizado con éxito!",
      newName: updatedUser.name,
      newImageUrl: updatedUser.image,
      newSlug: barbershop.slug,
    };
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    return {
      error: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
    };
  }
}

export async function completeOnboarding() {
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  try {
    await prisma.user.update({
      where: { id: user!.id },
      data: { onboardingCompleted: true },
    });

    revalidatePath("/dashboard");
    return { success: "¡Onboarding completado!" };
  } catch (error) {
    return { error: "No se pudo completar el onboarding." };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
) {
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (booking?.barberId !== user!.id) {
      return { error: "No tienes permiso para modificar este turno." };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard");
    return {
      success: `El turno ha sido marcado como: ${newStatus.toLowerCase()}.`,
    };
  } catch (error) {
    return { error: "No se pudo actualizar el estado del turno." };
  }
}

export async function deleteClient(clientId: string) {
  const { user, error } = await getCurrentUserAndBarbershop();
  if (error) return { error };

  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        bookings: {
          some: {
            barberId: user!.id,
          },
        },
      },
    });

    if (!client) {
      return { error: "No tienes permiso para eliminar este cliente." };
    }

    await prisma.booking.deleteMany({
      where: {
        clientId: clientId,
        barberId: user!.id,
      },
    });

    await prisma.client.delete({
      where: { id: clientId },
    });

    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    return { success: "Cliente eliminado con éxito." };
  } catch (error) {
    return { error: "No se pudo eliminar al cliente." };
  }
}
