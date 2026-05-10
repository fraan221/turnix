import { revalidateTag } from "next/cache";

/**
 * Invalida todos los caches relacionados con analíticas.
 * Debe llamarse después de crear, actualizar o eliminar turnos (bookings)
 * o clientes, ya que las métricas dependen de estos datos.
 */
export function invalidateAnalyticsCache() {
  revalidateTag("analytics", "max");
  revalidateTag("barber-analytics", "max");
  revalidateTag("client-metrics", "max");
  revalidateTag("barber-client-metrics", "max");
}
