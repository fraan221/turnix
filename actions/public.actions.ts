"use server";

import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { startOfDay, endOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getBarberAvailability(barberId: string, date: Date) {
  const dayOfWeek = date.getDay();

  const [workingHours, bookings, timeBlocks] = await Promise.all([
    prisma.workingHours.findUnique({
      where: {
        barberId_dayOfWeek: {
          barberId: barberId,
          dayOfWeek: dayOfWeek,
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        barberId: barberId,
        startTime: {
          gte: startOfDay(date),
          lt: endOfDay(date),
        },
        status: { not: "CANCELLED" },
      },
      include: {
        service: {
          select: {
            durationInMinutes: true,
          },
        },
      },
    }),
    prisma.timeBlock.findMany({
      where: {
        barberId: barberId,
        OR: [
          {
            startTime: { lte: endOfDay(date) },
            endTime: { gte: startOfDay(date) },
          },
        ],
      },
    }),
  ]);

  return {
    workingHours,
    bookings,
    timeBlocks,
  };
}

export async function createPublicBooking(prevState: any, formData: FormData) {
  const BookingFormSchema = z.object({
    barberId: z.string().cuid(),
    serviceIds: z.string().min(1),
    clientName: z
      .string()
      .min(1, "El nombre es requerido.")
      .max(50, "El nombre no puede exceder los 50 caracteres."),
    clientPhone: z
      .string()
      .transform((val) => val.replace(/[\s-()]/g, ""))
      .pipe(
        z
          .string()
          .min(8, "El número de WhatsApp debe tener al menos 8 dígitos.")
      )
      .pipe(
        z
          .string()
          .max(15, "El número de WhatsApp no puede tener más de 15 dígitos.")
      )
      .pipe(
        z
          .string()
          .regex(
            /^[0-9]+$/,
            "El número de WhatsApp solo puede contener dígitos."
          )
      ),
    startTime: z.string().datetime(),
  });

  const validatedFields = BookingFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message };
  }

  const {
    barberId,
    clientName,
    clientPhone,
    startTime: startTimeISO,
    serviceIds,
  } = validatedFields.data;
  const serviceId = serviceIds.split(",")[0];
  const startTime = new Date(startTimeISO);

  try {
    const barber = await prisma.user.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        phone: true,
        barbershopId: true,
        barbershop: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!barber?.barbershopId) {
      return { error: "No se pudo encontrar la barbería asociada al barbero." };
    }

    const [client, service] = await Promise.all([
      prisma.client.upsert({
        where: { phone: clientPhone },
        update: { name: clientName },
        create: {
          name: clientName,
          phone: clientPhone,
          barbershopId: barber.barbershopId,
        },
      }),
      prisma.service.findUnique({
        where: { id: serviceId },
        select: { name: true },
      }),
    ]);

    if (!service) {
      return { error: "El servicio seleccionado ya no existe." };
    }

    await prisma.booking.create({
      data: {
        startTime,
        barber: {
          connect: {
            id: barberId,
          },
        },
        client: {
          connect: {
            id: client.id,
          },
        },
        service: {
          connect: {
            id: serviceId,
          },
        },
        barbershop: {
          connect: {
            id: barber.barbershopId,
          },
        },
      },
    });

    const newNotification = await prisma.notification.create({
      data: {
        userId: barberId,
        message: `Nuevo turno: "${service.name}" con ${clientName}`,
        clientId: client.id,
      },
    });

    await pusherServer.trigger(
      `notifications_${barberId}`,
      "new-notification",
      newNotification
    );

    if (barber?.barbershop?.slug) {
      revalidatePath(`/${barber.barbershop.slug}`);
    }

    return {
      success: "¡Turno confirmado con éxito!",
      bookingDetails: {
        clientName: client.name,
        barberPhone: barber.phone || "",
      },
    };
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return {
      error: `No se pudo crear la reserva: ${error.message || error.toString()}`,
    };
  }
}
