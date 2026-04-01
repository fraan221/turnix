import { ClientMetricsData, Period } from "@/actions/analytics.actions";
import { StatCard } from "@/components/analytics/StatCard";
import { UserPlus, RefreshCw, Users, Star } from "lucide-react";

interface ClientMetricsCardsProps {
  metrics: ClientMetricsData;
  period: Period;
}

const comparisonDescriptions: Record<Period, string> = {
  day: "vs ayer",
  week: "vs semana pasada",
  month: "vs mes pasado",
  quarter: "vs 3 meses anteriores",
  year: "vs año pasado",
  all: "histórico",
};

export function ClientMetricsCards({ metrics, period }: ClientMetricsCardsProps) {
  const desc = comparisonDescriptions[period];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Clientes nuevos"
        value={metrics.newClientsCount}
        description={desc}
        icon={<UserPlus className="w-6 h-6 text-blue-500" />}
        change={period !== "all" ? metrics.newClientsChange : undefined}
      />
      <StatCard
        title="Tasa de retención"
        value={`${metrics.retentionRate.toFixed(1)}%`}
        description={desc}
        icon={<RefreshCw className="w-6 h-6 text-green-500" />}
        change={period !== "all" ? metrics.retentionRateChange : undefined}
      />
      <StatCard
        title="Total clientes"
        value={metrics.totalClientsCount}
        description="Acumulado histórico"
        icon={<Users className="w-6 h-6 text-violet-500" />}
      />
      <StatCard
        title="Clientes VIP"
        value={metrics.vipClientsCount}
        description="Con 5+ turnos"
        icon={<Star className="w-6 h-6 text-yellow-500" />}
      />
    </div>
  );
}
