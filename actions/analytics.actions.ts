"use server";

import { getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import { BookingStatus, Role } from "@prisma/client";
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getEachDayOfInterval,
} from "@/lib/date-helpers";

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
  const user = await getUserForSettings();

  if (!user) {
    throw new Error("No autenticado");
  }

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
      startDate = getStartOfDay(now);
      endDate = getEndOfDay(now);
      break;
    case "week":
      startDate = getStartOfWeek(now);
      endDate = getEndOfWeek(now);
      break;
    case "month":
      startDate = getStartOfMonth(now);
      endDate = getEndOfMonth(now);
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
    const intervalDays = getEachDayOfInterval(startDate, endDate);
    const getFormatOptions = (p: Period): Intl.DateTimeFormatOptions => {
      switch (p) {
        case "day":
          return { hour: "2-digit", minute: "2-digit", hour12: false };
        case "month":
          return { day: "2-digit", month: "2-digit" };
        case "week":
          return { weekday: "long" };
      }
    };

    const formatOptions = getFormatOptions(period);
    const formatter = new Intl.DateTimeFormat("es-AR", formatOptions);

    intervalDays.forEach((day) => {
      const dayKey = formatter.format(day);
      dailyRevenue[dayKey] = 0;
    });

    completedBookingsForPeriod.forEach((booking) => {
      const dayKey = formatter.format(booking.startTime);
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
