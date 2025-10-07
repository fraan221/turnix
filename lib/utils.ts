import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDuration(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const hoursString = hours > 0 ? `${hours}h` : "";
  const minutesString = minutes > 0 ? `${minutes}m` : "";

  return `${hoursString} ${minutesString}`.trim();
}

export function formatPhoneNumberForWhatsApp(phone: string) {
  if (!phone) return "";

  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("54")) {
    if (cleaned.length > 9 && !cleaned.startsWith("549")) {
      cleaned = "549" + cleaned.substring(2);
    }
    return cleaned;
  }

  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith("15")) {
    cleaned = cleaned.substring(2);
  }

  return "549" + cleaned;
}
