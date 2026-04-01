"use client";

import type { Period, PersonalStatsData, ClientMetricsData, AnalyticsData } from "@/actions/analytics.actions";
import { IncomeOverTimeChart } from "@/components/analytics/IncomeOverTimeChart";
import { StatCard } from "@/components/analytics/StatCard";
import { PeriodDropdown } from "@/components/analytics/PeriodDropdown";
import { ClientMetricsCards } from "@/components/analytics/ClientMetricsCards";
import { ClientInsightsPanel } from "@/components/analytics/ClientInsightsPanel";
import { TopClientsTable } from "@/components/analytics/TopClientsTable";
import { TopServicesCard } from "@/components/analytics/TopServicesCard";
import { formatPrice } from "@/lib/utils";
import { DollarSign, Scissors, Users, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface BarberStatsDashboardProps {
  initialData: PersonalStatsData;
  clientMetrics: ClientMetricsData;
}

const periodDescriptions: Record<Period, string> = {
  day: "en las últimas 24 horas",
  week: "en los últimos 7 días",
  month: "en los últimos 30 días",
  quarter: "en los últimos 3 meses",
  year: "este año",
  all: "en total",
};

export default function BarberStatsDashboard({
  initialData,
  clientMetrics,
}: BarberStatsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get("period") as Period) || "week";

  const handlePeriodChange = (newPeriod: Period) => {
    router.push(`/dashboard/my-stats?period=${newPeriod}`);
  };

  if (initialData.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{initialData.error}</p>
      </div>
    );
  }

  const analyticsDataForInsights: AnalyticsData = {
    totalRevenue: initialData.totalRevenue,
    completedBookings: initialData.completedBookings,
    cancelledBookings: initialData.cancelledBookings,
    chartData: initialData.chartData,
    topServices: initialData.topServices,
  };

  return (
    <div className="mx-auto space-y-8 max-w-7xl">
      <div>
        <div className="flex items-center justify-between gap-2 sm:flex-row xs:flex-col mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Mis estadísticas</h2>
          <PeriodDropdown
            currentPeriod={currentPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </div>
      </div>

      <div className="grid max-w-7xl grid-cols-1 gap-4 mx-auto md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ingresos generados"
          value={formatPrice(initialData.totalRevenue)}
          description={`Plata que ingresó ${periodDescriptions[currentPeriod]}`}
          icon={<DollarSign className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          title="Turnos atendidos"
          value={initialData.completedBookings}
          description={`Clientes que vinieron ${periodDescriptions[currentPeriod]}`}
          icon={<Scissors className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="Turnos perdidos"
          value={initialData.cancelledBookings}
          description={`Te cancelaron ${periodDescriptions[currentPeriod]}`}
          icon={<XCircle className="w-6 h-6 text-red-500" />}
        />
        <StatCard
          title="Clientes únicos"
          value={initialData.uniqueClients}
          description={`Clientes atendidos ${periodDescriptions[currentPeriod]}`}
          icon={<Users className="w-6 h-6 text-violet-500" />}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        <IncomeOverTimeChart data={initialData.chartData} period={currentPeriod} />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 pt-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight mb-4">Tus Clientes</h3>
          <div className="space-y-6">
            <ClientMetricsCards metrics={clientMetrics} period={currentPeriod} />
            <ClientInsightsPanel
              metrics={clientMetrics}
              analyticsData={analyticsDataForInsights}
              period={currentPeriod}
            />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TopClientsTable clients={clientMetrics.topClients} />
              <TopServicesCard services={initialData.topServices} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
