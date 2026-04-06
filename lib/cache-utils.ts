import { revalidateTag } from "next/cache";

/**
 * Invalida todos los caches relacionados con analíticas.
 * Debe llamarse después de crear, actualizar o eliminar turnos (bookings)
 * o clientes, ya que las métricas dependen de estos datos.
 */
export function invalidateAnalyticsCache() {
  revalidateTag("analytics");
  revalidateTag("barber-analytics");
  revalidateTag("client-metrics");
  revalidateTag("barber-client-metrics");
}
