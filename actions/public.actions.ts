"use server";

import prisma from "@/lib/prisma";
import { broadcastToUser } from "@/lib/supabase-server";
import {
  getEndOfDay,
  getStartOfDay,
  formatTime,
  formatBookingDateForNotification,
} from "@/lib/date-helpers";
import { z } from "zod";
import { Role, WorkShiftType } from "@prisma/client";
import { sendPushNotification } from "@/lib/push";

export type AvailabilityStatus =
  | "AVAILABLE"
  | "FULLY_BOOKED"
  | "WORKDAY_OVER"
  | "DAY_OFF";

export type BarberAvailability = {
  slotGroups: TimeSlotGroup[];
  status: AvailabilityStatus;
};

const shiftNames: Record<WorkShiftType, string> = {
  MORNING: "Mañana",
  AFTERNOON: "Tarde",
  NIGHT: "Noche",
};

type TimeSlotGroup = {
  shiftName: string;
  slots: { time: string; available: boolean }[];
};

export async function getBarberAvailability(
  barberId: string,
  date: Date,
  totalDuration: number,
): Promise<BarberAvailability> {
  const dayOfWeek = date.getDay();

  const barber = await prisma.user.findUnique({
    where: { id: barberId },
    include: { teamMembership: { include: { barbershop: true } } },
  });

  if (!barber) {
    return { slotGroups: [], status: "DAY_OFF" };
  }

  const startOfDayUTC = getStartOfDay(date);
  const endOfDayUTC = getEndOfDay(date);

  let workingHours = await prisma.workingHours.findUnique({
    where: { barberId_dayOfWeek: { barberId: barberId, dayOfWeek } },
    include: { blocks: { orderBy: { startTime: "asc" } } },
  });

  if (!workingHours && barber.role === Role.BARBER) {
    const ownerId = barber.teamMembership?.barbershop.ownerId;
    if (ownerId) {
      workingHours = await prisma.workingHours.findUnique({
        where: { barberId_dayOfWeek: { barberId: ownerId, dayOfWeek } },
        include: { blocks: { orderBy: { startTime: "asc" } } },
      });
    }
  }

  const [bookings, timeBlocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        barberId: barberId,
        startTime: { gte: startOfDayUTC, lt: endOfDayUTC },
        status: { not: "CANCELLED" },
        // Note: Pending payment bookings ARE included to block the slot
        // They will be cleaned up by cron after 15 minutes if unpaid
      },
      include: { service: { select: { durationInMinutes: true } } },
    }),
    prisma.timeBlock.findMany({
      where: {
        barberId: barberId,
        startTime: { lte: endOfDayUTC },
        endTime: { gte: startOfDayUTC },
      },
    }),
  ]);

  const isWorkingDay = workingHours?.isWorking ?? false;
  const shifts = workingHours?.blocks ?? [];

  if (!isWorkingDay || shifts.length === 0) {
    return { slotGroups: [], status: "DAY_OFF" };
  }

  const timeZone = "America/Argentina/Buenos_Aires";

  const now = new Date();

  const todayInArgentinaString = now.toLocaleDateString("en-CA", { timeZone });
  const selectedDateInArgentinaString = date.toLocaleDateString("en-CA", {
    timeZone,
  });
  const isSelectedDateToday =
    todayInArgentinaString === selectedDateInArgentinaString;

  const createDateInArgentina = (timeString: string): Date => {
    const isoString = `${selectedDateInArgentinaString}T${timeString}:00-03:00`;
    return new Date(isoString);
  };

  const lastShift = shifts[shifts.length - 1];
  const finalEndTime = createDateInArgentina(lastShift.endTime);

  if (isSelectedDateToday && now >= finalEndTime) {
    return { slotGroups: [], status: "WORKDAY_OVER" };
  }

  const slotGroups: TimeSlotGroup[] = [];

  for (const shift of shifts) {
    const shiftSlots: { time: string; available: boolean }[] = [];
    const dayStartTime = createDateInArgentina(shift.startTime);
    const dayEndTime = createDateInArgentina(shift.endTime);

    let currentTime =
      isSelectedDateToday && now > dayStartTime ? now : dayStartTime;

    if (isSelectedDateToday && currentTime.getTime() === now.getTime()) {
      const minutes = currentTime.getMinutes();
      if (minutes > 0 && minutes < 15) currentTime.setMinutes(15, 0, 0);
      else if (minutes > 15 && minutes < 30) currentTime.setMinutes(30, 0, 0);
      else if (minutes > 30 && minutes < 45) currentTime.setMinutes(45, 0, 0);
      else if (minutes > 45) {
        currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
      }
    }

    // Build list of occupied intervals within this shift
    const occupiedIntervals: { start: Date; end: Date }[] = [];

    for (const booking of bookings) {
      const bookingStart = new Date(booking.startTime);
      const durationInMinutes =
        booking.durationAtBooking ?? booking.service?.durationInMinutes ?? 60;
      const bookingEnd = new Date(
        bookingStart.getTime() + durationInMinutes * 60000,
      );
      // Only include if it overlaps with this shift
      if (bookingEnd > dayStartTime && bookingStart < dayEndTime) {
        occupiedIntervals.push({ start: bookingStart, end: bookingEnd });
      }
    }

    for (const block of timeBlocks) {
      const blockStart = new Date(block.startTime);
      const blockEnd = new Date(block.endTime);
      // Only include if it overlaps with this shift
      if (blockEnd > dayStartTime && blockStart < dayEndTime) {
        occupiedIntervals.push({ start: blockStart, end: blockEnd });
      }
    }

    // Sort occupied intervals by start time
    occupiedIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Generate slots using back-to-back scheduling
    let slotStart = new Date(currentTime);

    while (
      slotStart.getTime() + totalDuration * 60000 <=
      dayEndTime.getTime()
    ) {
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);

      // Find all intervals that overlap with this slot and get the latest end time
      const overlappingIntervals = occupiedIntervals.filter(
        (interval) => slotStart < interval.end && slotEnd > interval.start,
      );
      const isAvailable = overlappingIntervals.length === 0;

      shiftSlots.push({
        time: formatTime(slotStart),
        available: isAvailable,
      });

      if (isAvailable) {
        // Slot is available, move by service duration
        slotStart = new Date(slotStart.getTime() + totalDuration * 60000);
      } else {
        // Slot overlaps, snap to the latest end time among all overlapping intervals
        const latestEndTime = Math.max(
          ...overlappingIntervals.map((interval) => interval.end.getTime()),
        );
        slotStart = new Date(latestEndTime);
      }
    }

    if (shiftSlots.length > 0) {
      slotGroups.push({ shiftName: shiftNames[shift.type], slots: shiftSlots });
    }
  }

  if (slotGroups.length > 0) {
    const allSlots = slotGroups.flatMap((group) => group.slots);
    if (allSlots.some((slot) => slot.available)) {
      return { slotGroups, status: "AVAILABLE" };
    } else {
      return { slotGroups, status: "FULLY_BOOKED" };
    }
  }

  return { slotGroups: [], status: "FULLY_BOOKED" };
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
          .min(8, "El número de WhatsApp debe tener al menos 8 dígitos."),
      )
      .pipe(
        z
          .string()
          .max(15, "El número de WhatsApp no puede tener más de 15 dígitos."),
      )
      .pipe(
        z
          .string()
          .regex(
            /^[0-9]+$/,
            "El número de WhatsApp solo puede contener dígitos.",
          ),
      ),
    startTime: z.string().datetime(),
  });

  const validatedFields = BookingFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
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
      select: {
        teamsEnabled: true,
        ownerId: true,
        name: true,
        depositEnabled: true,
        depositAmountType: true,
        depositAmount: true,
        mpCredentials: { select: { id: true } },
      },
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
        select: { name: true, price: true, durationInMinutes: true },
      }),
    ]);

    if (!service) {
      return { error: "El servicio seleccionado ya no existe." };
    }

    const requiresDeposit =
      barbershop.depositEnabled &&
      !!barbershop.mpCredentials &&
      barbershop.depositAmount;

    let calculatedDeposit: number | null = null;
    if (requiresDeposit && barbershop.depositAmount) {
      if (barbershop.depositAmountType === "percentage") {
        calculatedDeposit =
          (service.price * Number(barbershop.depositAmount)) / 100;
      } else {
        calculatedDeposit = Number(barbershop.depositAmount);
      }
    }

    const existingPendingBooking = await prisma.booking.findFirst({
      where: {
        barberId,
        clientId: client.id,
        startTime,
        paymentStatus: "PENDING",
        status: { not: "CANCELLED" },
      },
    });

    if (existingPendingBooking) {
      await prisma.booking.update({
        where: { id: existingPendingBooking.id },
        data: {
          serviceId: serviceId,
          priceAtBooking: service.price,
          durationAtBooking: service.durationInMinutes,
          barbershopId: barbershopId,
          depositAmount:
            requiresDeposit && calculatedDeposit
              ? calculatedDeposit
              : existingPendingBooking.depositAmount,
          updatedAt: new Date(),
        },
      });

      if (requiresDeposit && calculatedDeposit) {
        return {
          requiresPayment: true,
          bookingId: existingPendingBooking.id,
          depositAmount: calculatedDeposit,
          barbershopName: barbershop.name,
          serviceName: service.name,
        };
      }

      return {
        success: "¡Turno confirmado con éxito!",
        bookingDetails: {
          clientName: client.name,
          barberPhone: barber.phone || "",
          barberName: barber.name || "",
          serviceName: service.name,
          startTime: startTime.toISOString(),
          teamsEnabled: barbershop.teamsEnabled,
        },
      };
    }

    const booking = await prisma.booking.create({
      data: {
        startTime,
        priceAtBooking: service.price,
        durationAtBooking: service.durationInMinutes,
        barber: { connect: { id: barberId } },
        client: { connect: { id: client.id } },
        service: { connect: { id: serviceId } },
        barbershop: { connect: { id: barbershopId } },
        ...(requiresDeposit && calculatedDeposit
          ? {
              depositAmount: calculatedDeposit,
              paymentStatus: "PENDING",
            }
          : {}),
      },
    });

    if (requiresDeposit && calculatedDeposit) {
      return {
        requiresPayment: true,
        bookingId: booking.id,
        depositAmount: calculatedDeposit,
        barbershopName: barbershop.name,
        serviceName: service.name,
      };
    }

    const formattedTime = formatTime(startTime);
    const relativeDateString = formatBookingDateForNotification(startTime);

    const notificationBody = `${clientName} reservó "${service.name}" para ${relativeDateString} a las ${formattedTime}hs.`;

    const pushPayloadBarber = {
      title: "¡Nuevo Turno!",
      body: notificationBody,
      url: "/dashboard/notifications",
    };
    await sendPushNotification(barberId, pushPayloadBarber);

    const barberNotificationMessage = notificationBody;
    const barberNotification = await prisma.notification.create({
      data: {
        userId: barberId,
        message: barberNotificationMessage,
        clientId: client.id,
      },
    });

    await broadcastToUser(barberId, "new-notification", {
      id: barberNotification.id,
      message: barberNotification.message,
    });

    const isEmployeeBooking = barber.id !== barbershop.ownerId;
    if (barbershop.teamsEnabled && isEmployeeBooking) {
      const ownerNotificationBody = `${clientName} reservó con ${barber.name} para ${relativeDateString} a las ${formattedTime}hs.`;

      const pushPayloadOwner = {
        title: "Nuevo Turno en tu Equipo",
        body: ownerNotificationBody,
        url: "/dashboard/notifications",
      };
      await sendPushNotification(barbershop.ownerId, pushPayloadOwner);

      const ownerNotificationMessage = ownerNotificationBody;
      const ownerNotification = await prisma.notification.create({
        data: {
          userId: barbershop.ownerId,
          message: ownerNotificationMessage,
          clientId: client.id,
        },
      });

      await broadcastToUser(barbershop.ownerId, "new-notification", {
        id: ownerNotification.id,
        message: ownerNotification.message,
      });
    }

    return {
      success: "¡Turno confirmado con éxito!",
      bookingDetails: {
        clientName: client.name,
        barberPhone: barber.phone || "",
        barberName: barber.name || "",
        serviceName: service.name,
        startTime: startTime.toISOString(),
        teamsEnabled: barbershop.teamsEnabled,
      },
    };
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return {
      error: `No se pudo crear la reserva: ${error.message || error.toString()}`,
    };
  }
}

export async function cancelFailedBooking(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { barbershop: true },
    });

    if (!booking) {
      return { error: "Reserva no encontrada" };
    }

    // Only cancel if it's still pending (avoid cancelling if it was somehow paid in the meantime)
    if (booking.paymentStatus === "PENDING") {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });
    }

    return { success: true, barbershopSlug: booking.barbershop.slug };
  } catch (error) {
    console.error("Error cancelling failed booking:", error);
    return { error: "Error al cancelar la reserva" };
  }
}
