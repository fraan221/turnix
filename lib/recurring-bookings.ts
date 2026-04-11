import {
  addDays,
  addWeeks,
  getDay,
  isBefore,
  isAfter,
  setHours,
  setMinutes,
  startOfDay,
  differenceInCalendarWeeks,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Argentina/Buenos_Aires";

// Helper: Calcula si es el 1er, 2do, 3er o 4to día_de_semana del mes (ej: 1er Martes = 1)
function getOccurrenceOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

export function generateUpcomingBookingDates(
  pattern: {
    createdAt: Date;
    dayOfWeek: number;
    startTime: string;
    frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    weekOfMonth?: number | null;
    suspendedUntil?: Date | null;
  },
  horizonWeeks: number = 4
): Date[] {
  const dates: Date[] = [];
  const nowUtc = new Date();
  const nowInAr = toZonedTime(nowUtc, TIMEZONE);
  const createdAtInAr = toZonedTime(pattern.createdAt, TIMEZONE);
  const horizonEndInAr = addWeeks(nowInAr, horizonWeeks);

  const [hours, minutes] = pattern.startTime.split(":").map(Number);

  // Iteramos día por día desde hoy hasta el final del horizonte
  let currentAr = startOfDay(nowInAr);

  while (isBefore(currentAr, horizonEndInAr)) {
    if (getDay(currentAr) === pattern.dayOfWeek) {
      let matchesFrequency = false;

      if (pattern.frequency === "WEEKLY") {
        matchesFrequency = true;
      } else if (pattern.frequency === "BIWEEKLY") {
        // Usamos createdAt como ancla. Si la diferencia de semanas es par, toca turno.
        // Empezando las semanas en Lunes (weekStartsOn: 1) para consistencia en Argentina.
        const weeksDiff = differenceInCalendarWeeks(currentAr, createdAtInAr, { weekStartsOn: 1 });
        if (weeksDiff % 2 === 0) {
          matchesFrequency = true;
        }
      } else if (pattern.frequency === "MONTHLY" && pattern.weekOfMonth) {
        // Verifica si es el N-ésimo día de la semana del mes (ej: 1er Martes)
        if (getOccurrenceOfMonth(currentAr) === pattern.weekOfMonth) {
          matchesFrequency = true;
        }
      }

      if (matchesFrequency) {
        // Construimos la fecha completa con hora en la zona de Argentina
        const dateWithTimeAr = setMinutes(setHours(currentAr, hours), minutes);
        const dateUtc = fromZonedTime(dateWithTimeAr, TIMEZONE);

        // Verificamos que sea en el futuro
        if (isAfter(dateUtc, nowUtc)) {
          // Verificamos que no esté suspendido
          if (!pattern.suspendedUntil || isAfter(dateUtc, pattern.suspendedUntil)) {
            dates.push(dateUtc);
          }
        }
      }
    }
    
    currentAr = addDays(currentAr, 1);
  }

  return dates;
}
