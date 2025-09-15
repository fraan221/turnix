"use server";

import { getUserForSettings } from "@/lib/data";
import prisma from "@/lib/prisma";
import { BookingStatus, Role, Prisma } from "@prisma/client";
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
} from "@/lib/date-helpers";
import { unstable_cache as cache } from "next/cache";

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

const getBarbershopAnalytics = cache(
  async (
    barbershopId: string,
    period: Period,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      const timeZone = "America/Argentina/Buenos_Aires";

      const completedBookingsPromise = prisma.booking.findMany({
        where: {
          barbershopId,
          startTime: { gte: startDate, lte: endDate },
          status: BookingStatus.COMPLETED,
        },
        include: { service: { select: { price: true } } },
      });

      const cancelledBookingsCountPromise = prisma.booking.count({
        where: {
          barbershopId,
          startTime: { gte: startDate, lte: endDate },
          status: BookingStatus.CANCELLED,
        },
      });

      let chartQuery: Prisma.Sql;

      const baseCTE = Prisma.sql`
        WITH "BookingsInLocalTime" AS (
          SELECT
            b."startTime" AT TIME ZONE ${timeZone} as local_time,
            s.price
          FROM "Booking" b
          JOIN "Service" s ON b."serviceId" = s.id
          WHERE b."barbershopId" = ${barbershopId}
            AND b."startTime" BETWEEN ${startDate} AND ${endDate}
            AND b.status = 'COMPLETED'
        )
      `;

      if (period === "day") {
        chartQuery = Prisma.sql`
          ${baseCTE}
          SELECT
            TO_CHAR(local_time, 'HH24:00') AS name,
            SUM(price)::float AS total
          FROM "BookingsInLocalTime"
          GROUP BY name
          ORDER BY name ASC;
        `;
      } else if (period === "week") {
        chartQuery = Prisma.sql`
          ${baseCTE}
          SELECT
            EXTRACT(ISODOW FROM local_time)::text AS name,
            SUM(price)::float AS total
          FROM "BookingsInLocalTime"
          GROUP BY name
          ORDER BY name ASC;
        `;
      } else {
        chartQuery = Prisma.sql`
          ${baseCTE}
          SELECT
            TO_CHAR(local_time, 'DD/MM') AS name,
            SUM(price)::float AS total
          FROM "BookingsInLocalTime"
          GROUP BY name
          ORDER BY name ASC;
        `;
      }

      const chartPromise = prisma.$queryRaw<ChartDataPoint[]>(chartQuery);

      const [completedBookings, cancelledBookingsCount, rawChartData] =
        await Promise.all([
          completedBookingsPromise,
          cancelledBookingsCountPromise,
          chartPromise,
        ]);

      const totalRevenue = completedBookings.reduce(
        (acc, booking) => acc + booking.service.price,
        0
      );
      const completedBookingsCount = completedBookings.length;

      const chartDataMap = new Map<string, number>(
        rawChartData.map((item) => [String(item.name), item.total])
      );
      let chartData: ChartDataPoint[] = [];

      if (period === "day") {
        for (let i = 0; i < 24; i++) {
          const name = `${i.toString().padStart(2, "0")}:00`;
          chartData.push({ name, total: chartDataMap.get(name) || 0 });
        }
      } else if (period === "week") {
        const weekDays = [
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado",
          "Domingo",
        ];
        for (let i = 1; i <= 7; i++) {
          const name = weekDays[i - 1];
          chartData.push({ name, total: chartDataMap.get(String(i)) || 0 });
        }
      } else {
        chartData = rawChartData.map((d) => ({ ...d, name: String(d.name) }));
      }

      return {
        totalRevenue,
        completedBookings: completedBookingsCount,
        cancelledBookings: cancelledBookingsCount,
        chartData,
        error: undefined,
      };
    } catch (error) {
      console.error("Error en la consulta de analíticas:", error);
      return {
        totalRevenue: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        chartData: [],
        error: "No se pudieron cargar los datos de la base de datos.",
      };
    }
  },
  ["getBarbershopAnalytics"],
  {
    revalidate: 300,
    tags: ["analytics"],
  }
);

export async function getAnalyticsData(period: Period): Promise<AnalyticsData> {
  const user = await getUserForSettings();

  if (!user || user.role !== Role.OWNER) {
    return {
      totalRevenue: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      chartData: [],
      error: user ? "No autorizado para ver estadísticas." : "No autenticado",
    };
  }

  const barbershopId = user.ownedBarbershop?.id;
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
  }

  return getBarbershopAnalytics(barbershopId, period, startDate, endDate);
}
