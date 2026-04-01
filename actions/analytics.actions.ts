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
  startDate?: Date,
  endDate?: Date,
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

  const groupedData = new Map<string, { total: number; sortKey: number }>();
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  for (const item of rawChartData) {
    const [yearStr, monthStr, dayStr] = String(item.name).split("-");
    if (!yearStr || !monthStr || !dayStr) continue;

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) continue;

    let groupKey = String(item.name);
    let sortKey = year * 10000 + (month + 1) * 100 + day;

    if (period === "month") {
      groupKey = `${day.toString().padStart(2, "0")}/${monthStr}`;
      sortKey = day;
    } else if (period === "quarter") {
      const weekOfMonth = Math.ceil(day / 7);
      groupKey = `Sem ${weekOfMonth} ${months[month]}`;
      sortKey = year * 1000 + (month + 1) * 10 + weekOfMonth;
    } else if (period === "year") {
      groupKey = months[month];
      sortKey = month + 1;
    } else if (period === "all") {
      groupKey = `${months[month]} ${yearStr.slice(-2)}`;
      sortKey = year * 100 + (month + 1);
    }

    const existing = groupedData.get(groupKey);
    if (existing) {
      existing.total += item.total;
    } else {
      groupedData.set(groupKey, { total: item.total, sortKey });
    }
  }

  if (period === "month" && groupedData.size > 0) {
    const monthReference = startDate ? new Date(startDate) : new Date();

    const year = monthReference.getFullYear();
    const monthIndex = monthReference.getMonth();
    const monthLabel = String(monthIndex + 1).padStart(2, "0");
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const filledData: ChartDataPoint[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${String(day).padStart(2, "0")}/${monthLabel}`;
      filledData.push({
        name: key,
        total: groupedData.get(key)?.total ?? 0,
      });
    }

    return filledData;
  }

  if (period === "quarter" && groupedData.size > 0) {
    const rangeStart = startDate ? new Date(startDate) : new Date();
    const rangeEnd = endDate ? new Date(endDate) : new Date();

    const currentMonth = new Date(
      rangeStart.getFullYear(),
      rangeStart.getMonth(),
      1,
    );
    const lastMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);

    const filledData: ChartDataPoint[] = [];

    while (currentMonth <= lastMonth) {
      const monthIndex = currentMonth.getMonth();
      const year = currentMonth.getFullYear();
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const weeksInMonth = Math.ceil(daysInMonth / 7);

      for (let week = 1; week <= weeksInMonth; week++) {
        const key = `Sem ${week} ${months[monthIndex]}`;
        filledData.push({
          name: key,
          total: groupedData.get(key)?.total ?? 0,
        });
      }

      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return filledData;
  }

  if (period === "year") {
    return months.map((monthName) => ({
      name: monthName,
      total: groupedData.get(monthName)?.total ?? 0,
    }));
  }

  if (period === "all" && groupedData.size > 0) {
    const totalsByMonth = new Map<number, number>();

    for (const value of Array.from(groupedData.values())) {
      totalsByMonth.set(value.sortKey, value.total);
    }

    const sortKeys = Array.from(totalsByMonth.keys()).sort((a, b) => a - b);
    const firstMonth = sortKeys[0];
    const lastMonth = sortKeys[sortKeys.length - 1];

    if (firstMonth === undefined || lastMonth === undefined) {
      return [];
    }

    const filledData: ChartDataPoint[] = [];
    let year = Math.floor(firstMonth / 100);
    let month = firstMonth % 100;

    while (year * 100 + month <= lastMonth) {
      const monthKey = year * 100 + month;
      const monthLabel = `${months[month - 1]} ${String(year).slice(-2)}`;

      filledData.push({
        name: monthLabel,
        total: totalsByMonth.get(monthKey) ?? 0,
      });

      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    return filledData;
  }

  return Array.from(groupedData.entries())
    .sort(([, a], [, b]) => a.sortKey - b.sortKey)
    .map(([name, value]) => ({ name, total: value.total }));
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
      {
        const startDate = getStartOfMonth(new Date(now));
        startDate.setMonth(startDate.getMonth() - 2);
        return {
          startDate,
          endDate: getEndOfDay(now),
        };
      }
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
      const end = new Date(getStartOfMonth(now));
      end.setDate(0);
      const start = getStartOfMonth(new Date(end));
      start.setMonth(start.getMonth() - 2);
      return { start, end: getEndOfMonth(end) };
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

      const formattedChartData = formatChartDataByPeriod(
        rawChartData,
        period,
        startDate,
        endDate,
      );

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
        chartData: formattedChartData,
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
        chartData: formatChartDataByPeriod(rawChartData, period, startDate, endDate),
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
