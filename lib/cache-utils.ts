import { revalidateTag } from "next/cache";

/**
 * Invalida todos los caches relacionados con analíticas.
 * Debe llamarse después de crear, actualizar o eliminar turnos (bookings)
 * o clientes, ya que las métricas dependen de estos datos.
 */
export function invalidateAnalyticsCache() {
  // @ts-expect-error Next 16 typing bug
  revalidateTag("analytics");
  // @ts-expect-error Next 16 typing bug
  revalidateTag("barber-analytics");
  // @ts-expect-error Next 16 typing bug
  revalidateTag("client-metrics");
  // @ts-expect-error Next 16 typing bug
  revalidateTag("barber-client-metrics");
}
