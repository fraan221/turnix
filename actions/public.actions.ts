"use server";

import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { startOfDay, endOfDay } from "date-fns";
import { z } from "zod";
import { Role } from "@prisma/client";

export async function getBarberAvailability(barberId: string, date: Date) {
  const dayOfWeek = date.getDay();

  const barber = await prisma.user.findUnique({
    where: { id: barberId },
    include: {
      teamMembership: {
        include: {
          barbershop: true,
        },
      },
    },
  });

  if (!barber) {
    return {
      workingHours: null,
      bookings: [],
      timeBlocks: [],
    };
  }

  const scheduleOwnerId =
    barber.role === Role.OWNER
      ? barber.id
      : barber.teamMembership?.barbershop.ownerId;

  if (!scheduleOwnerId) {
    return {
      workingHours: null,
      bookings: [],
      timeBlocks: [],
    };
  }

  const [workingHours, bookings, timeBlocks] = await Promise.all([
    prisma.workingHours.findUnique({
      where: {
        barberId_dayOfWeek: {
          barberId: scheduleOwnerId,
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
      include: {
        ownedBarbershop: true,
        teamMembership: true,
      },
    });

    if (!barber) {
      return { error: "El barbero seleccionado no existe." };
    }

    const barbershopId =
      barber.ownedBarbershop?.id || barber.teamMembership?.barbershopId;

    if (!barbershopId) {
      return { error: "No se pudo encontrar la barbería asociada al barbero." };
    }

    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { teamsEnabled: true, ownerId: true },
    });

    if (!barbershop) {
      return { error: "Los detalles de la barbería no fueron encontrados." };
    }

    const [client, service] = await Promise.all([
      prisma.client.upsert({
        where: { phone: clientPhone },
        update: { name: clientName },
        create: {
          name: clientName,
          phone: clientPhone,
          barbershopId: barbershopId,
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
        barber: { connect: { id: barberId } },
        client: { connect: { id: client.id } },
        service: { connect: { id: serviceId } },
        barbershop: { connect: { id: barbershopId } },
      },
    });

    const barberNotificationMessage = `Nuevo turno: ${clientName} reservó un "${service.name}".`;
    const barberNotification = await prisma.notification.create({
      data: {
        userId: barberId,
        message: barberNotificationMessage,
        clientId: client.id,
      },
    });
    await pusherServer.trigger(
      `notifications_${barberId}`,
      "new-notification",
      barberNotification
    );

    const isEmployeeBooking = barber.id !== barbershop.ownerId;
    if (barbershop.teamsEnabled && isEmployeeBooking) {
      const ownerNotificationMessage = `Nuevo turno: ${clientName} reservó un "${service.name}" con ${barber.name}.`;
      const ownerNotification = await prisma.notification.create({
        data: {
          userId: barbershop.ownerId,
          message: ownerNotificationMessage,
          clientId: client.id,
        },
      });
      await pusherServer.trigger(
        `notifications_${barbershop.ownerId}`,
        "new-notification",
        ownerNotification
      );
    }

    return {
      success: "¡Turno confirmado con éxito!",
      bookingDetails: {
        clientName: client.name,
        barberPhone: barber.phone || "",
        barberName: barber.name || "",
      },
    };
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return {
      error: `No se pudo crear la reserva: ${error.message || error.toString()}`,
    };
  }
}
