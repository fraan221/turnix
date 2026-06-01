import prisma from "@/lib/prisma";
import { BookingStatus, PaymentMethod } from "@prisma/client";
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

export type Period = "day" | "week" | "month" | "lastMonth" | "year" | "all";

export type ReportBooking = {
  date: Date;
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  barberName: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
};

export function formatPaymentMethod(method: PaymentMethod | null): string {
  if (!method) return "Sin clasificar";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

/**
 * Obtiene el rango de fechas asociado a un período.
 */
export function getDateRangeForPeriod(period: Period) {
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
    case "lastMonth": {
      const ref = new Date(now);
      ref.setMonth(ref.getMonth() - 1);
      return {
        startDate: getStartOfMonth(ref),
        endDate: getEndOfMonth(ref),
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

/**
 * Retorna un label descriptivo en español argentino del período y rango.
 */
export function formatPeriodLabel(period: Period, startDate: Date, endDate: Date): string {
  const startStr = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(startDate);

  const endStr = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(endDate);

  switch (period) {
    case "day":
      return `Hoy (${startStr})`;
    case "week":
      return `Esta Semana (${startStr} al ${endStr})`;
    case "month":
      return `Este Mes (${startStr} al ${endStr})`;
    case "lastMonth":
      return `Mes Pasado (${startStr} al ${endStr})`;
    case "year":
      return `Este Año (${startStr} al ${endStr})`;
    case "all":
      return `Todo el tiempo (hasta ${endStr})`;
    default:
      return `${startStr} al ${endStr}`;
  }
}

/**
 * Obtiene los turnos completados para un rango de fechas y barbería
 * formateados especialmente para los reportes de exportación.
 */
export async function getDetailedBookingsForReport(
  barbershopId: string,
  startDate: Date,
  endDate: Date
): Promise<ReportBooking[]> {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        barbershopId,
        status: BookingStatus.COMPLETED,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: {
          select: {
            name: true,
            price: true,
          },
        },
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        barber: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return bookings.map((booking) => {
      const amount = booking.priceAtBooking ?? booking.service?.price ?? 0;
      return {
        date: booking.startTime,
        clientName: booking.client?.name ?? "Cliente",
        clientPhone: booking.client?.phone ?? null,
        serviceName: booking.service?.name ?? "Servicio sin nombre",
        barberName: booking.barber?.name ?? "Barbero",
        amount,
        paymentMethod: booking.paymentMethod,
      };
    });
  } catch (error) {
    console.error("Error al obtener bookings para reporte:", error);
    throw new Error("No se pudieron obtener los turnos para el reporte.");
  }
}
