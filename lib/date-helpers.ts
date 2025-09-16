const timeZone = "America/Argentina/Buenos_Aires";

/**
 * Devuelve el inicio del día para una fecha dada (00:00:00).
 */
export function getStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Devuelve el final del día para una fecha dada (23:59:59).
 */
export function getEndOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Devuelve el inicio de la semana (Lunes) para una fecha dada.
 */
export function getStartOfWeek(date: Date): Date {
  const newDate = new Date(date);
  const day = newDate.getDay(); // Domingo = 0, Lunes = 1, ...
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para que el Lunes sea el primer día
  const startOfWeek = new Date(newDate.setDate(diff));
  return getStartOfDay(startOfWeek);
}

/**
 * Devuelve el final de la semana (Domingo) para una fecha dada.
 */
export function getEndOfWeek(date: Date): Date {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return getEndOfDay(endOfWeek);
}

/**
 * Devuelve el inicio del mes para una fecha dada.
 */
export function getStartOfMonth(date: Date): Date {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  return getStartOfDay(startOfMonth);
}

/**
 * Devuelve el final del mes para una fecha dada.
 */
export function getEndOfMonth(date: Date): Date {
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return getEndOfDay(endOfMonth);
}

/**
 * Genera un array de fechas para cada día en un intervalo.
 */
export function getEachDayOfInterval(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let currentDate = new Date(start);

  while (currentDate <= end) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
}

/**
 * Formatea una fecha a un string con formato 'DD/MM/YYYY' en la zona horaria de Argentina.
 * @param date - La fecha a formatear.
 * @returns La fecha formateada como string.
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).format(new Date(date));
}

/**
 * Formatea una fecha a un string con formato de tiempo 'HH:mm' en la zona horaria de Argentina.
 * @param date - La fecha a formatear.
 * @returns La hora formateada como string.
 */
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(date));
}

/**
 * Formatea una fecha a un string con formato específico para inputs de tipo 'datetime-local'.
 * @param date - La fecha a formatear.
 * @returns La fecha formateada como 'YYYY-MM-DDTHH:mm'.
 */
export function formatToDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Calcula el número de días restantes desde ahora hasta una fecha final.
 * Devuelve 0 si la fecha ya pasó.
 */
export function getDaysRemaining(endDate: Date | string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();

  if (diffTime < 0) {
    return 0;
  }

  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Formatea una fecha a un string largo y descriptivo, en la zona horaria de Argentina.
 * Ej: "domingo, 7 de septiembre, 22:57 hs"
 */
export function formatLongDateTime(date: Date | string): string {
  const d = new Date(date);
  const datePart = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(d);
  const timePart = formatTime(d);
  return `${datePart}, ${timePart} hs`;
}

/**
 * Formatea una fecha a un string corto, en la zona horaria de Argentina.
 * Ej: "7/9/2025 - 22:57 hs"
 */
export function formatShortDateTime(date: Date | string): string {
  const d = new Date(date);
  const datePart = formatDate(d); // Ya utiliza la zona horaria correcta
  const timePart = formatTime(d); // Ya utiliza la zona horaria correcta
  return `${datePart} - ${timePart} hs`;
}

/**
 * Verifica si una fecha dada pertenece a la semana actual (Lunes-Domingo).
 */
export function isDateInThisWeek(date: Date): boolean {
  const today = new Date();
  const startOfThisWeek = getStartOfWeek(today);
  const endOfThisWeek = getEndOfWeek(today);
  return date >= startOfThisWeek && date <= endOfThisWeek;
}

/**
 * Verifica si una fecha dada pertenece al mes actual.
 */
export function isDateInThisMonth(date: Date): boolean {
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Devuelve una cadena de texto que representa la distancia de una fecha a ahora.
 * Ej: "hace 5 minutos", "hace 2 horas"
 */
export function formatDistanceFromNow(date: Date | string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );

  const intervals: { [key: string]: number } = {
    año: 31536000,
    mes: 2592000,
    día: 86400,
    hora: 3600,
    minuto: 60,
  };

  let counter;
  for (const interval in intervals) {
    counter = Math.floor(seconds / intervals[interval]);
    if (counter > 0) {
      if (counter === 1) {
        return `hace 1 ${interval}`;
      } else {
        return `hace ${counter} ${interval}s`;
      }
    }
  }
  return "justo ahora";
}

/**
 * Formatea una fecha a un string con formato de fecha largo, en la zona horaria de Argentina.
 * Ej: "domingo, 7 de septiembre de 2025"
 */
export function formatLongDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(date));
}

/**
 * Formatea una fecha a un string con formato 'YYYY-MM-DD' para inputs de tipo 'date'.
 * @param date - La fecha a formatear.
 */
export function formatToDateInput(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha a un string con formato de texto largo, en la zona horaria de Argentina.
 * Ej: "7 de septiembre de 2025"
 */
export function formatFullDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(date));
}

/**
 * Verifica si una fecha dada es el día de hoy.
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Formatea una fecha a un string con formato de confirmación largo, en la zona horaria de Argentina.
 * Ej: "domingo, 7 de septiembre de 2025 a las 23:57 hs"
 */
export function formatConfirmationDateTime(date: Date | string): string {
  const d = new Date(date);
  const datePart = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(d);
  const timePart = formatTime(d);
  return `${datePart} a las ${timePart} hs`;
}
