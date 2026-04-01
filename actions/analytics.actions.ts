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
  getStartOfQuarter,
  getEndOfQuarter,
  getStartOfYear,
  getEndOfYear,
  getAllTimeStart,
} from "@/lib/date-helpers";
import { unstable_cache as cache } from "next/cache";

export type Period = "day" | "week" | "month" | "quarter" | "year" | "all";

export type ChartDataPoint = {
  name: string;
  total: number;
};

export type AnalyticsData = {
  totalRevenue: number;
  completedBookings: number;
  cancelledBookings: number;
  chartData: ChartDataPoint[];
  topServices: {
    name: string | null;
    count: number;
  }[];
  error?: string;
};

export type ClientMetricsData = {
  newClientsCount: number;
  newClientsChange: number;
  totalClientsCount: number;
  returningClientsCount: number;
  retentionRate: number;
  retentionRateChange: number;
  vipClientsCount: number;
  topClients: {
    id: string;
    name: string;
    phone: string;
    visitsCount: number;
    totalSpent: number;
    isVip: boolean;
  }[];
  inactiveClientsCount: number;
  averageVisitsPerClient: number;
  error?: string;
};

function formatChartDataByPeriod(
  rawChartData: ChartDataPoint[],
  period: Period,
): ChartDataPoint[] {
  if (period === "day") {
    const chartDataMap = new Map<string, number>(
      rawChartData.map((item) => [String(item.name), item.total]),
    );
    const chartData: ChartDataPoint[] = [];

    for (let i = 0; i < 24; i++) {
      const name = `${i.toString().padStart(2, "0")}:00`;
      chartData.push({ name, total: chartDataMap.get(name) || 0 });
    }

    return chartData;
  }

  if (period === "week") {
    const chartDataMap = new Map<string, number>(
      rawChartData.map((item) => [String(item.name), item.total]),
    );
    const chartData: ChartDataPoint[] = [];
    const weekDays = [
      "Lun",
      "Mar",
      "Mié",
      "Jue",
      "Vie",
      "Sáb",
      "Dom",
    ];

    for (let i = 1; i <= 7; i++) {
      const name = weekDays[i - 1];
      chartData.push({ name, total: chartDataMap.get(String(i)) || 0 });
    }

    return chartData;
  }

  const groupedData = new Map<string, number>();
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  for (const item of rawChartData) {
    const [yearStr, monthStr, dayStr] = String(item.name).split("-");
    if (!yearStr || !monthStr || !dayStr) continue;
    
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    
    let groupKey = String(item.name);

    if (period === "month") {
      groupKey = `${day.toString().padStart(2, "0")}/${monthStr}`;
    } else if (period === "quarter") {
      const weekOfMonth = Math.ceil(day / 7);
      groupKey = `Sem ${weekOfMonth} ${months[month]}`;
    } else if (period === "year") {
      groupKey = months[month];
    } else if (period === "all") {
      groupKey = `${months[month]} ${yearStr.slice(-2)}`;
    }

    groupedData.set(groupKey, (groupedData.get(groupKey) || 0) + item.total);
  }

  const result: ChartDataPoint[] = [];
  Array.from(groupedData.entries()).forEach(([name, total]) => {
    result.push({ name, total });
  });

  return result;
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
    case "quarter":
      return {
        startDate: getStartOfQuarter(now),
        endDate: getEndOfQuarter(now),
      };
    case "year":
      return {
        startDate: getStartOfYear(now),
        endDate: getEndOfYear(now),
      };
    case "all":
      return {
        startDate: getAllTimeStart(),
        endDate: getEndOfDay(now),
      };
    default:
      return {
        startDate: getStartOfWeek(now),
        endDate: getEndOfWeek(now),
      };
  }
}

function getPreviousPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();

  switch (period) {
    case "day": {
      const start = getStartOfDay(now);
      start.setDate(start.getDate() - 1);
      return { start, end: getEndOfDay(start) };
    }
    case "week": {
      const start = getStartOfWeek(now);
      start.setDate(start.getDate() - 7);
      return { start, end: getEndOfWeek(start) };
    }
    case "month": {
      const start = getStartOfMonth(now);
      start.setMonth(start.getMonth() - 1);
      return { start, end: getEndOfMonth(start) };
    }
    case "quarter": {
      const start = getStartOfQuarter(now);
      start.setMonth(start.getMonth() - 3);
      return { start, end: getEndOfQuarter(start) };
    }
    case "year": {
      const start = getStartOfYear(now);
      start.setFullYear(start.getFullYear() - 1);
      return { start, end: getEndOfYear(start) };
    }
    case "all":
    default:
      // For all time, there is no previous period
      return { start: getAllTimeStart(), end: getAllTimeStart() };
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
            TO_CHAR(DATE_TRUNC('day', local_time), 'YYYY-MM-DD') AS name,
            SUM(price)::float AS total
          FROM "BookingsInLocalTime"
          GROUP BY DATE_TRUNC('day', local_time)
          ORDER BY DATE_TRUNC('day', local_time) ASC;
        `;
      }

      const chartPromise = prisma.$queryRaw<ChartDataPoint[]>(chartQuery);

      const topServicesPromise = prisma.booking.groupBy({
        by: ["serviceId"],
        where: {
          barbershopId,
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
      });

      const [completedBookings, cancelledBookingsCount, topServices, rawChartData] =
        await Promise.all([
          completedBookingsPromise,
          cancelledBookingsCountPromise,
          topServicesPromise,
          chartPromise,
        ]);

      const totalRevenue = completedBookings.reduce(
        (acc, booking) =>
          acc + (booking.priceAtBooking ?? booking.service?.price ?? 0),
        0,
      );
      const completedBookingsCount = completedBookings.length;

      const chartData = formatChartDataByPeriod(rawChartData, period);

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
        cancelledBookings: cancelledBookingsCount,
        chartData,
        topServices: formattedTopServices,
        error: undefined,
      };
    } catch (error) {
      console.error("Error en la consulta de analíticas:", error);
      return {
        totalRevenue: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        chartData: [],
        topServices: [],
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
      topServices: [],
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
      topServices: [],
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
            TO_CHAR(DATE_TRUNC('day', local_time), 'YYYY-MM-DD') AS name,
            SUM(price)::float AS total
          FROM "BookingsInLocalTime"
          GROUP BY DATE_TRUNC('day', local_time)
          ORDER BY DATE_TRUNC('day', local_time) ASC;
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

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

const getBarbershopClientMetrics = cache(
  async (
    barbershopId: string,
    _period: Period,
    startDate: Date,
    endDate: Date,
    prevStartDate: Date,
    prevEndDate: Date,
  ): Promise<ClientMetricsData> => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        newClientsCount,
        prevNewClientsCount,
        totalClientsCount,
        currentBookings,
        prevBookingsGrouped,
        inactiveClientsCount,
      ] = await Promise.all([
        prisma.client.count({
          where: { barbershopId, createdAt: { gte: startDate, lte: endDate } },
        }),
        prisma.client.count({
          where: { barbershopId, createdAt: { gte: prevStartDate, lte: prevEndDate } },
        }),
        prisma.client.count({
          where: { barbershopId },
        }),
        prisma.booking.findMany({
          where: {
            barbershopId,
            startTime: { gte: startDate, lte: endDate },
            status: BookingStatus.COMPLETED,
          },
          select: {
            clientId: true,
            priceAtBooking: true,
            service: { select: { price: true } },
            client: { select: { id: true, name: true, phone: true } },
          },
        }),
        prisma.booking.groupBy({
          by: ["clientId"],
          where: {
            barbershopId,
            startTime: { gte: prevStartDate, lte: prevEndDate },
            status: BookingStatus.COMPLETED,
          },
          _count: { id: true },
        }),
        prisma.client.count({
          where: {
            barbershopId,
            bookings: { none: { startTime: { gte: thirtyDaysAgo } } },
          },
        }),
      ]);

      const clientStatsMap = new Map<
        string,
        { count: number; totalSpent: number; client: { id: string; name: string; phone: string } }
      >();

      for (const b of currentBookings) {
        if (!b.client) continue;
        const spent = b.priceAtBooking ?? b.service?.price ?? 0;
        const existing = clientStatsMap.get(b.clientId);
        if (existing) {
          existing.count++;
          existing.totalSpent += spent;
        } else {
          clientStatsMap.set(b.clientId, {
            count: 1,
            totalSpent: spent,
            client: b.client,
          });
        }
      }

      const clientsArray = Array.from(clientStatsMap.values());
      let returningClientsCount = 0;
      let vipClientsCount = 0;

      for (const c of clientsArray) {
        if (c.count >= 2) returningClientsCount++;
        if (c.count >= 5) vipClientsCount++;
      }

      const totalWithBookings = clientsArray.length;
      const retentionRate =
        totalWithBookings > 0
          ? (returningClientsCount / totalWithBookings) * 100
          : 0;
      const averageVisitsPerClient =
        totalWithBookings > 0 ? currentBookings.length / totalWithBookings : 0;

      let prevReturning = 0;
      for (const b of prevBookingsGrouped) {
        if (b._count.id >= 2) prevReturning++;
      }
      const prevTotalWithBookings = prevBookingsGrouped.length;
      const prevRetentionRate =
        prevTotalWithBookings > 0
          ? (prevReturning / prevTotalWithBookings) * 100
          : 0;

      const topClients = clientsArray
        .sort((a, b) => b.count - a.count || b.totalSpent - a.totalSpent)
        .slice(0, 20)
        .map((c) => ({
          id: c.client.id,
          name: c.client.name,
          phone: c.client.phone,
          visitsCount: c.count,
          totalSpent: c.totalSpent,
          isVip: c.count >= 5,
        }));

      return {
        newClientsCount,
        newClientsChange: calculatePercentageChange(
          newClientsCount,
          prevNewClientsCount,
        ),
        totalClientsCount,
        returningClientsCount,
        retentionRate,
        retentionRateChange: retentionRate - prevRetentionRate,
        vipClientsCount,
        topClients,
        inactiveClientsCount,
        averageVisitsPerClient,
      };
    } catch (error) {
      console.error("Error en la consulta de métricas de clientes:", error);
      return {
        newClientsCount: 0,
        newClientsChange: 0,
        totalClientsCount: 0,
        returningClientsCount: 0,
        retentionRate: 0,
        retentionRateChange: 0,
        vipClientsCount: 0,
        topClients: [],
        inactiveClientsCount: 0,
        averageVisitsPerClient: 0,
        error: "No se pudieron cargar las métricas de clientes.",
      };
    }
  },
  ["getClientMetrics"],
  {
    revalidate: 300,
    tags: ["client-metrics"],
  },
);

export async function getClientMetrics(
  period: Period = "month",
): Promise<ClientMetricsData> {
  const user = await getUserForSettings();

  if (!user || user.role !== Role.OWNER) {
    return {
      newClientsCount: 0,
      newClientsChange: 0,
      totalClientsCount: 0,
      returningClientsCount: 0,
      retentionRate: 0,
      retentionRateChange: 0,
      vipClientsCount: 0,
      topClients: [],
      inactiveClientsCount: 0,
      averageVisitsPerClient: 0,
      error: user ? "No autorizado para ver estadísticas." : "No autenticado",
    };
  }

  const barbershopId = user.ownedBarbershop?.id;
  if (!barbershopId) {
    return {
      newClientsCount: 0,
      newClientsChange: 0,
      totalClientsCount: 0,
      returningClientsCount: 0,
      retentionRate: 0,
      retentionRateChange: 0,
      vipClientsCount: 0,
      topClients: [],
      inactiveClientsCount: 0,
      averageVisitsPerClient: 0,
      error: "Barbería no encontrada para el usuario.",
    };
  }

  const { startDate, endDate } = getDateRangeForPeriod(period);
  const { start: prevStartDate, end: prevEndDate } =
    getPreviousPeriodRange(period);

  return getBarbershopClientMetrics(
    barbershopId,
    period,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  );
}

const getBarberClientMetrics = cache(
  async (
    barberId: string,
    _period: Period,
    startDate: Date,
    endDate: Date,
    prevStartDate: Date,
    prevEndDate: Date,
  ): Promise<ClientMetricsData> => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        newClientsCount,
        prevNewClientsCount,
        totalClientsCount,
        currentBookings,
        prevBookingsGrouped,
        inactiveClientsCount,
      ] = await Promise.all([
        prisma.client.count({
          where: {
            bookings: { some: { barberId } },
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.client.count({
          where: {
            bookings: { some: { barberId } },
            createdAt: { gte: prevStartDate, lte: prevEndDate },
          },
        }),
        prisma.client.count({
          where: {
            bookings: { some: { barberId } },
          },
        }),
        prisma.booking.findMany({
          where: {
            barberId,
            startTime: { gte: startDate, lte: endDate },
            status: BookingStatus.COMPLETED,
          },
          select: {
            clientId: true,
            priceAtBooking: true,
            service: { select: { price: true } },
            client: { select: { id: true, name: true, phone: true } },
          },
        }),
        prisma.booking.groupBy({
          by: ["clientId"],
          where: {
            barberId,
            startTime: { gte: prevStartDate, lte: prevEndDate },
            status: BookingStatus.COMPLETED,
          },
          _count: { id: true },
        }),
        prisma.client.count({
          where: {
            bookings: { some: { barberId } },
            AND: {
              NOT: {
                bookings: {
                  some: {
                    barberId,
                    startTime: { gte: thirtyDaysAgo },
                  },
                },
              },
            },
          },
        }),
      ]);

      const clientStatsMap = new Map<
        string,
        { count: number; totalSpent: number; client: { id: string; name: string; phone: string } }
      >();

      for (const b of currentBookings) {
        if (!b.client) continue;
        const spent = b.priceAtBooking ?? b.service?.price ?? 0;
        const existing = clientStatsMap.get(b.clientId);
        if (existing) {
          existing.count++;
          existing.totalSpent += spent;
        } else {
          clientStatsMap.set(b.clientId, {
            count: 1,
            totalSpent: spent,
            client: b.client,
          });
        }
      }

      const clientsArray = Array.from(clientStatsMap.values());
      let returningClientsCount = 0;
      let vipClientsCount = 0;

      for (const c of clientsArray) {
        if (c.count >= 2) returningClientsCount++;
        if (c.count >= 5) vipClientsCount++;
      }

      const totalWithBookings = clientsArray.length;
      const retentionRate =
        totalWithBookings > 0
          ? (returningClientsCount / totalWithBookings) * 100
          : 0;
      const averageVisitsPerClient =
        totalWithBookings > 0 ? currentBookings.length / totalWithBookings : 0;

      let prevReturning = 0;
      for (const b of prevBookingsGrouped) {
        if (b._count.id >= 2) prevReturning++;
      }
      const prevTotalWithBookings = prevBookingsGrouped.length;
      const prevRetentionRate =
        prevTotalWithBookings > 0
          ? (prevReturning / prevTotalWithBookings) * 100
          : 0;

      const topClients = clientsArray
        .sort((a, b) => b.count - a.count || b.totalSpent - a.totalSpent)
        .slice(0, 20)
        .map((c) => ({
          id: c.client.id,
          name: c.client.name,
          phone: c.client.phone,
          visitsCount: c.count,
          totalSpent: c.totalSpent,
          isVip: c.count >= 5,
        }));

      return {
        newClientsCount,
        newClientsChange: calculatePercentageChange(
          newClientsCount,
          prevNewClientsCount,
        ),
        totalClientsCount,
        returningClientsCount,
        retentionRate,
        retentionRateChange: retentionRate - prevRetentionRate,
        vipClientsCount,
        topClients,
        inactiveClientsCount,
        averageVisitsPerClient,
      };
    } catch (error) {
      console.error("Error en la consulta de métricas de clientes de barbero:", error);
      return {
        newClientsCount: 0,
        newClientsChange: 0,
        totalClientsCount: 0,
        returningClientsCount: 0,
        retentionRate: 0,
        retentionRateChange: 0,
        vipClientsCount: 0,
        topClients: [],
        inactiveClientsCount: 0,
        averageVisitsPerClient: 0,
        error: "No se pudieron cargar las métricas de clientes.",
      };
    }
  },
  ["getBarberClientMetrics"],
  {
    revalidate: 300,
    tags: ["barber-client-metrics"],
  },
);

export async function getBarberClientMetricsData(
  period: Period = "month",
): Promise<ClientMetricsData> {
  const user = await getUserForSettings();

  if (!user || user.role !== Role.BARBER) {
    return {
      newClientsCount: 0,
      newClientsChange: 0,
      totalClientsCount: 0,
      returningClientsCount: 0,
      retentionRate: 0,
      retentionRateChange: 0,
      vipClientsCount: 0,
      topClients: [],
      inactiveClientsCount: 0,
      averageVisitsPerClient: 0,
      error: user ? "No autorizado para ver estadísticas." : "No autenticado",
    };
  }

  const { startDate, endDate } = getDateRangeForPeriod(period);
  const { start: prevStartDate, end: prevEndDate } =
    getPreviousPeriodRange(period);

  return getBarberClientMetrics(
    user.id,
    period,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  );
}
