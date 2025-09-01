"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { BookingStatus, Role } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

export type Period = "day" | "week" | "month";

export type ChartDataPoint = {
  name: string;
  total: number;
};

export type AnalyticsData = {
  totalRevenue: number;
  completedBookings: number;
  cancelledBookings: number;
  chartData: ChartDataPoint[];
  error?: string;
};

export async function getAnalyticsData(period: Period): Promise<AnalyticsData> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("No autenticado");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: true,
      teamMembership: { include: { barbershop: true } },
    },
  });

  if (user?.role !== Role.OWNER) {
    return {
      totalRevenue: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      chartData: [],
      error: "No autorizado para ver estadísticas.",
    };
  }

  const barbershopId =
    user.ownedBarbershop?.id || user.teamMembership?.barbershopId;
  if (!barbershopId) {
    return {
      totalRevenue: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      chartData: [],
      error: "Barbería no encontrada para el usuario.",
    };
  }

  let startDate: Date;
  let endDate: Date;
  const now = new Date();

  switch (period) {
    case "day":
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case "week":
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "month":
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    default:
      throw new Error("Período no válido");
  }

  try {
    const completedBookingsForPeriod = await prisma.booking.findMany({
      where: {
        barbershopId,
        startTime: { gte: startDate, lte: endDate },
        status: BookingStatus.COMPLETED,
      },
      include: {
        service: {
          select: { price: true },
        },
      },
    });

    const totalRevenue = completedBookingsForPeriod.reduce(
      (acc, booking) => acc + booking.service.price,
      0
    );

    const completedBookingsCount = completedBookingsForPeriod.length;

    const cancelledBookingsCount = await prisma.booking.count({
      where: {
        barbershopId,
        startTime: { gte: startDate, lte: endDate },
        status: BookingStatus.CANCELLED,
      },
    });

    const dailyRevenue: { [key: string]: number } = {};
    const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
    const dateFormat =
      period === "day" ? "HH:mm" : period === "month" ? "dd/MM" : "EEEE";

    intervalDays.forEach((day) => {
      const dayKey = format(day, dateFormat, { locale: es });
      dailyRevenue[dayKey] = 0;
    });

    completedBookingsForPeriod.forEach((booking) => {
      const dayKey = format(booking.startTime, dateFormat, { locale: es });
      dailyRevenue[dayKey] =
        (dailyRevenue[dayKey] || 0) + booking.service.price;
    });

    const chartData: ChartDataPoint[] = Object.keys(dailyRevenue).map(
      (key) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        total: dailyRevenue[key],
      })
    );

    return {
      totalRevenue,
      completedBookings: completedBookingsCount,
      cancelledBookings: cancelledBookingsCount,
      chartData,
    };
  } catch (error) {
    console.error("Error al obtener datos de analíticas:", error);
    return {
      totalRevenue: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      chartData: [],
      error: "No se pudieron cargar las estadísticas.",
    };
  }
}
