"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { BookingStatus } from "@prisma/client";
import { z } from "zod";

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
const ServiceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  price: z.coerce.number().positive("El precio debe ser un número positivo."),
  durationInMinutes: z.coerce
    .number()
    .int()
    .positive("La duración debe ser un número entero positivo.")
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
});

export async function createService(prevState: any, formData: FormData) {
  const {
    user,
    barbershopId,
    error: authError,
  } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

  const validatedFields = ServiceSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, price, durationInMinutes, description } = validatedFields.data;

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
    console.error("Error al crear el servicio:", error);
    return { error: "No se pudo crear el servicio." };
  }
}

export async function updateService(
  serviceId: string,
  prevState: any,
  formData: FormData
) {
  const { user, error: authError } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

  const serviceToUpdate = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!serviceToUpdate || serviceToUpdate.barberId !== user!.id) {
    return { error: "Operación no permitida." };
  }

  const validatedFields = ServiceSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, price, durationInMinutes, description } = validatedFields.data;

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

export async function updateWorkingHours(prevState: any, formData: FormData) {
  const { user, error: authError } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

  try {
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    const upsertOperations = days.map((day, i) => {
      const isWorking = formData.get(`${day}-isWorking`) === "on";
      const startTime = formData.get(`${day}-startTime`)?.toString() || "09:00";
      const endTime = formData.get(`${day}-endTime`)?.toString() || "18:00";

      return prisma.workingHours.upsert({
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
    });

    await prisma.$transaction(upsertOperations);

    revalidatePath("/dashboard/schedule");
    return { success: "Horario semanal guardado con éxito." };
  } catch (error) {
    console.error("Error al guardar el horario semanal:", error);
    return {
      error: "No se pudo guardar el horario. La operación fue revertida.",
    };
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
const TimeBlockSchema = z
  .object({
    startDateTime: z
      .string()
      .datetime({ message: "Formato de fecha de inicio inválido." }),
    endDateTime: z
      .string()
      .datetime({ message: "Formato de fecha de fin inválido." }),
    reason: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      return new Date(data.endDateTime) > new Date(data.startDateTime);
    },
    {
      message: "La fecha y hora de fin debe ser posterior a la de inicio.",
      path: ["endDateTime"],
    }
  );

export async function createTimeBlock(prevState: any, formData: FormData) {
  const { user, error: authError } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

  const validatedFields = TimeBlockSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { startDateTime, endDateTime, reason } = validatedFields.data;

  try {
    await prisma.timeBlock.create({
      data: {
        startTime: new Date(startDateTime),
        endTime: new Date(endDateTime),
        reason: reason,
        barberId: user!.id,
      },
    });
    revalidatePath("/dashboard/schedule");
    return { success: "Bloqueo de tiempo creado con éxito." };
  } catch (error) {
    console.error("Error al crear el bloqueo de tiempo:", error);
    return { error: "No se pudo crear el bloqueo." };
  }
}

export async function updateTimeBlock(
  blockId: string,
  prevState: any,
  formData: FormData
) {
  const { user, error: authError } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

  const blockToUpdate = await prisma.timeBlock.findUnique({
    where: { id: blockId },
  });

  if (!blockToUpdate || blockToUpdate.barberId !== user!.id) {
    return { error: "Operación no permitida." };
  }

  const validatedFields = TimeBlockSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { startDateTime, endDateTime, reason } = validatedFields.data;

  try {
    await prisma.timeBlock.update({
      where: { id: blockId },
      data: {
        startTime: new Date(startDateTime),
        endTime: new Date(endDateTime),
        reason,
      },
    });

    revalidatePath("/dashboard/schedule");
    return { success: "Bloqueo actualizado con éxito." };
  } catch (error) {
    console.error("Error al actualizar el bloqueo de tiempo:", error);
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

export type FormState = {
  success: string | null;
  error: string | null;
};

export async function updateClientNotes(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const clientId = formData.get("clientId")?.toString();
  const notes = formData.get("notes")?.toString();

  const session = await auth();
  if (!session?.user?.id) {
    return { success: null, error: "No autorizado." };
  }
  if (!clientId) {
    return { success: null, error: "ID de cliente no encontrado." };
  }

  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        barbershop: {
          barbers: {
            some: {
              id: session.user.id,
            },
          },
        },
      },
    });

    if (!client) {
      return {
        success: null,
        error: "Cliente no encontrado o no tienes permiso para editarlo.",
      };
    }

    await prisma.client.update({
      where: { id: clientId },
      data: {
        notes: notes,
      },
    });

    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: "¡Notas guardadas con éxito!", error: null };
  } catch (error) {
    console.error("Error al actualizar las notas del cliente:", error);
    return {
      success: null,
      error: "No se pudieron actualizar las notas del cliente.",
    };
  }
}

export async function createBooking(formData: FormData) {
  const {
    user,
    barbershopId,
    error: authError,
  } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

  const serviceId = formData.get("serviceId")?.toString();
  const clientName = formData.get("clientName")?.toString();
  const clientPhone = formData.get("clientPhone")?.toString();
  const startTimeStr = formData.get("startTime")?.toString();

  if (!serviceId || !clientName || !clientPhone || !startTimeStr) {
    return { error: "Todos los campos son requeridos para crear el turno." };
  }

  try {
    const startTime = new Date(startTimeStr);
    if (isNaN(startTime.getTime())) {
      return { error: "El formato de la fecha de inicio no es válido." };
    }

    await prisma.$transaction(async (tx) => {
      const client = await tx.client.upsert({
        where: { phone: clientPhone },
        update: { name: clientName },
        create: {
          name: clientName,
          phone: clientPhone,
          barbershopId: barbershopId!,
        },
      });

      await tx.booking.create({
        data: {
          startTime,
          barberId: user!.id,
          clientId: client.id,
          serviceId: serviceId,
          barbershopId: barbershopId!,
        },
      });
    });

    revalidatePath("/dashboard");
    return { success: "Turno creado con éxito." };
  } catch (error) {
    console.error("Error al crear el turno:", error);
    return { error: "No se pudo crear el turno. La operación fue revertida." };
  }
}

const UserProfileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  barbershopName: z.string().min(1, "El nombre de la barbería es requerido."),
  slug: z
    .string()
    .min(1, "La URL personalizada es requerida.")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Formato de URL no válido. Usa solo minúsculas, números y guiones (ej: mi-barberia)."
    ),
});

export async function updateUserProfile(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }
  const userId = session.user.id;

  const validatedFields = UserProfileSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, barbershopName, slug } = validatedFields.data;
  const avatarFile = formData.get("avatar") as File;
  let avatarUrl: string | undefined = undefined;

  try {
    const existingBarbershopWithSlug = await prisma.barbershop.findFirst({
      where: {
        slug: slug,
        ownerId: { not: userId },
      },
    });

    if (existingBarbershopWithSlug) {
      return {
        error: { slug: ["Esta URL ya está en uso. Por favor, elige otra."] },
      };
    }

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

    const [updatedUser, barbershop] = await prisma.$transaction(async (tx) => {
      const userUpdate = tx.user.update({
        where: { id: userId },
        data: {
          name,
          ...(avatarUrl && { image: avatarUrl }),
        },
      });

      const barbershopUpdate = tx.barbershop.upsert({
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
      return [await userUpdate, await barbershopUpdate];
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
  const { user, error: authError } = await getCurrentUserAndBarbershop();
  if (authError) return { error: authError };

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

    await prisma.$transaction(async (tx) => {
      await tx.booking.deleteMany({
        where: {
          clientId: clientId,
          barberId: user!.id,
        },
      });

      await tx.client.delete({
        where: { id: clientId },
      });
    });

    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    return { success: "Cliente y sus turnos han sido eliminados con éxito." };
  } catch (error) {
    console.error("Error al eliminar al cliente:", error);
    return {
      error: "No se pudo eliminar al cliente. La operación fue revertida.",
    };
  }
}
