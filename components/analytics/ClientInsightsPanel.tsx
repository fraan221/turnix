import { AnalyticsData, ClientMetricsData, Period } from "@/actions/analytics.actions";
import { StatCard } from "@/components/analytics/StatCard";
import { UserCheck, UserX, BarChart3, CalendarX } from "lucide-react";

interface ClientInsightsPanelProps {
  metrics: ClientMetricsData;
  analyticsData: AnalyticsData;
  period: Period;
}

const comparisonDescriptions: Record<Period, string> = {
  day: "hoy",
  week: "esta semana",
  month: "este mes",
  quarter: "este trimestre",
  year: "este año",
  all: "histórico",
};

export function ClientInsightsPanel({
  metrics,
  analyticsData,
  period,
}: ClientInsightsPanelProps) {
  const desc = comparisonDescriptions[period];

  const totalBookings =
    analyticsData.completedBookings + analyticsData.cancelledBookings;
  const cancellationRate =
    totalBookings > 0
      ? (analyticsData.cancelledBookings / totalBookings) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Clientes que volvieron"
        value={metrics.returningClientsCount}
        description={`Vinieron 2+ veces ${desc}`}
        icon={<UserCheck className="w-6 h-6 text-emerald-500" />}
      />
      <StatCard
        title="Promedio de visitas"
        value={metrics.averageVisitsPerClient.toFixed(1)}
        description={`Visitas por cliente ${desc}`}
        icon={<BarChart3 className="w-6 h-6 text-indigo-500" />}
      />
      <StatCard
        title="Tasa de cancelación"
        value={`${cancellationRate.toFixed(1)}%`}
        description={`Turnos cancelados ${desc}`}
        icon={<CalendarX className="w-6 h-6 text-rose-500" />}
      />
      <StatCard
        title="Clientes inactivos"
        value={metrics.inactiveClientsCount}
        description="Sin turnos en los últimos 30 días"
        icon={<UserX className="w-6 h-6 text-slate-500" />}
      />
    </div>
  );
}
