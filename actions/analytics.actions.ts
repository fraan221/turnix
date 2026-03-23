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

function formatChartDataByPeriod(
  rawChartData: ChartDataPoint[],
  period: Period,
): ChartDataPoint[] {
  const chartDataMap = new Map<string, number>(
    rawChartData.map((item) => [String(item.name), item.total]),
  );

  if (period === "day") {
    const chartData: ChartDataPoint[] = [];

    for (let i = 0; i < 24; i++) {
      const name = `${i.toString().padStart(2, "0")}:00`;
      chartData.push({ name, total: chartDataMap.get(name) || 0 });
    }

    return chartData;
  }

  if (period === "week") {
    const chartData: ChartDataPoint[] = [];
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

    return chartData;
  }

  return rawChartData.map((d) => ({ ...d, name: String(d.name) }));
}

function getDateRangeForPeriod(period: Period) {
  const now = new Date();

  switch (period) {
    case "day":
      return {
        startDate: getStartOfDay(now),
        endDate: getEndOfDay(now),
      };
    case "week":
      return {
        startDate: getStartOfWeek(now),
        endDate: getEndOfWeek(now),
      };
    case "month":
      return {
        startDate: getStartOfMonth(now),
        endDate: getEndOfMonth(now),
      };
  }
}

const getBarbershopAnalytics = cache(
  async (
    barbershopId: string,
    period: Period,
    startDate: Date,
    endDate: Date,
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
            b."startTime" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone} as local_time,
            COALESCE(b."priceAtBooking", s.price, 0) as price
          FROM "Booking" b
          LEFT JOIN "Service" s ON b."serviceId" = s.id
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
        (acc, booking) =>
          acc + (booking.priceAtBooking ?? booking.service?.price ?? 0),
        0,
      );
      const completedBookingsCount = completedBookings.length;

      const chartData = formatChartDataByPeriod(rawChartData, period);

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
  },
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

  const { startDate, endDate } = getDateRangeForPeriod(period);

  return getBarbershopAnalytics(barbershopId, period, startDate, endDate);
}

export type PersonalStatsData = {
  totalRevenue: number;
  completedBookings: number;
  cancelledBookings: number;
  uniqueClients: number;
  chartData: ChartDataPoint[];
  topServices: {
    name: string | null;
    count: number;
  }[];
  error?: string;
};

const getBarberAnalytics = cache(
  async (
    barberId: string,
    period: Period,
    startDate: Date,
    endDate: Date,
  ): Promise<PersonalStatsData> => {
    try {
      const timeZone = "America/Argentina/Buenos_Aires";

      let chartQuery: Prisma.Sql;

      const baseCTE = Prisma.sql`
        WITH "BookingsInLocalTime" AS (
          SELECT
            b."startTime" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone} as local_time,
            COALESCE(b."priceAtBooking", s.price, 0) as price
          FROM "Booking" b
          LEFT JOIN "Service" s ON b."serviceId" = s.id
          WHERE b."barberId" = ${barberId}
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

      const [completedBookings, cancelledBookings, topServices, rawChartData] =
        await Promise.all([
          prisma.booking.findMany({
            where: {
              barberId,
              status: BookingStatus.COMPLETED,
              startTime: { gte: startDate, lte: endDate },
            },
            include: {
              service: {
                select: {
                  price: true,
                },
              },
              client: {
                select: {
                  id: true,
                },
              },
            },
          }),
          prisma.booking.count({
            where: {
              barberId,
              status: BookingStatus.CANCELLED,
              startTime: { gte: startDate, lte: endDate },
            },
          }),
          prisma.booking.groupBy({
            by: ["serviceId"],
            where: {
              barberId,
              status: BookingStatus.COMPLETED,
              startTime: { gte: startDate, lte: endDate },
            },
            _count: {
              serviceId: true,
            },
            orderBy: {
              _count: {
                serviceId: "desc",
              },
            },
            take: 5,
          }),
          prisma.$queryRaw<ChartDataPoint[]>(chartQuery),
        ]);

      const totalRevenue = completedBookings.reduce(
        (acc, booking) =>
          acc + (booking.priceAtBooking ?? booking.service?.price ?? 0),
        0,
      );
      const completedBookingsCount = completedBookings.length;
      const uniqueClients = new Set(
        completedBookings.map((booking) => booking.client.id),
      ).size;

      const serviceIds = topServices
        .map((item) => item.serviceId)
        .filter(Boolean) as string[];

      const serviceDetails =
        serviceIds.length > 0
          ? await prisma.service.findMany({
              where: {
                id: { in: serviceIds },
              },
              select: {
                id: true,
                name: true,
              },
            })
          : [];

      const serviceMap = new Map(serviceDetails.map((s) => [s.id, s.name]));

      const formattedTopServices = topServices.map((item) => ({
        name: serviceMap.get(item.serviceId ?? "") || "Servicio eliminado",
        count: item._count.serviceId,
      }));

      return {
        totalRevenue,
        completedBookings: completedBookingsCount,
        cancelledBookings,
        uniqueClients,
        chartData: formatChartDataByPeriod(rawChartData, period),
        topServices: formattedTopServices,
      };
    } catch (error) {
      console.error("Error al calcular estadísticas personales:", error);
      return {
        totalRevenue: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        uniqueClients: 0,
        chartData: [],
        topServices: [],
        error: "No se pudieron cargar las estadísticas.",
      };
    }
  },
  ["getBarberAnalytics"],
  {
    revalidate: 300,
    tags: ["barber-analytics"],
  },
);

export async function getPersonalBarberStats(
  period: Period = "week",
): Promise<PersonalStatsData> {
  const user = await getUserForSettings();

  if (!user || user.role !== Role.BARBER) {
    return {
      totalRevenue: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      uniqueClients: 0,
      chartData: [],
      topServices: [],
      error: "No autorizado.",
    };
  }

  const { startDate, endDate } = getDateRangeForPeriod(period);

  return getBarberAnalytics(user.id, period, startDate, endDate);
}
