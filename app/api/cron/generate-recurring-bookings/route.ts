import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateUpcomingBookingDates } from "@/lib/recurring-bookings";
import { addWeeks } from "date-fns";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("CRON JOB: Iniciando generación de turnos fijos...");

  try {
    // Obtenemos todos los turnos fijos activos
    const recurringBookings = await prisma.recurringBooking.findMany({
      where: {
        isActive: true,
      },
      include: {
        service: true,
      }
    });

    if (recurringBookings.length === 0) {
      console.log("CRON JOB: No hay turnos fijos configurados.");
      return NextResponse.json({
        ok: true,
        message: "No recurring bookings found.",
      });
    }

    console.log(`CRON JOB: Se encontraron ${recurringBookings.length} turnos fijos activos.`);

    let createdCount = 0;
    const errors: { id: string; error: unknown }[] = [];

    // Iteramos sobre cada turno fijo y garantizamos un horizonte de 4 semanas
    for (const rb of recurringBookings) {
      try {
        console.log(` > Procesando turno fijo ID: ${rb.id}`);
        
        // 1. Obtener los bookings que ya existen en el futuro para este turno fijo
        const existingBookings = await prisma.booking.findMany({
          where: {
            recurringBookingId: rb.id,
            startTime: { gte: new Date() },
            status: { not: "CANCELLED" }, 
          },
          select: { startTime: true },
        });

        const existingTimes = new Set(
          existingBookings.map((b) => b.startTime.getTime())
        );

        // 2. Generar fechas teóricas para las próximas 4 semanas
        const upcomingDates = generateUpcomingBookingDates(
          {
            createdAt: rb.createdAt,
            dayOfWeek: rb.dayOfWeek,
            startTime: rb.startTime,
            frequency: rb.frequency as any,
            weekOfMonth: rb.weekOfMonth,
            suspendedUntil: rb.suspendedUntil,
          },
          4 // horizonte de 4 semanas
        );

        // 3. Filtrar las fechas que no existen todavía
        const datesToCreate = upcomingDates.filter(
          (date) => !existingTimes.has(date.getTime())
        );

        if (datesToCreate.length > 0) {
          // 4. Crear los turnos faltantes
          const newBookings = await prisma.booking.createMany({
            data: datesToCreate.map((date) => ({
              startTime: date,
              status: "SCHEDULED",
              barbershopId: rb.barbershopId,
              barberId: rb.barberId,
              clientId: rb.clientId,
              serviceId: rb.serviceId,
              priceAtBooking: rb.service.price,
              durationAtBooking: rb.service.durationInMinutes,
              activeDurationAtBooking: rb.service.activeDurationInMinutes,
              recurringBookingId: rb.id,
            })),
          });

          createdCount += newBookings.count;
          console.log(`   - Creados ${newBookings.count} nuevos turnos.`);
        } else {
          console.log(`   - Al día. No hay nuevos turnos que generar.`);
        }
      } catch (error) {
        console.error(`   - ERROR al procesar turno fijo ${rb.id}:`, error);
        errors.push({ id: rb.id, error });
      }
    }

    console.log(`CRON JOB: Proceso finalizado. Total turnos generados: ${createdCount}`);
    
    return NextResponse.json({
      ok: true,
      createdCount,
      errors,
    });
  } catch (error) {
    console.error("CRON JOB: Error catastrófico en el job.", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
