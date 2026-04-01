"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { StatCard } from "@/components/analytics/StatCard";
import { IncomeOverTimeChart } from "@/components/analytics/IncomeOverTimeChart";
import { formatPrice } from "@/lib/utils";
import { DollarSign, CheckCircle, XCircle } from "lucide-react";
import React from "react";
import type { AnalyticsData, ClientMetricsData, Period } from "@/actions/analytics.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodDropdown } from "@/components/analytics/PeriodDropdown";
import { ClientMetricsCards } from "@/components/analytics/ClientMetricsCards";
import { TopClientsTable } from "@/components/analytics/TopClientsTable";
import { ClientInsightsPanel } from "@/components/analytics/ClientInsightsPanel";

interface AnalyticsDashboardProps {
  initialData: AnalyticsData;
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

export default function AnalyticsDashboard({
  initialData,
  clientMetrics,
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get("period") as Period) || "week";

  const handlePeriodChange = (newPeriod: Period) => {
    router.push(`/dashboard/analytics?period=${newPeriod}`);
  };

  if (initialData.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{initialData.error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      <section className="space-y-4">
        <Card>
          <CardHeader className="flex items-center justify-between gap-2 sm:flex-row xs:flex-col">
            <CardTitle>Tu facturación</CardTitle>
            <PeriodDropdown
              currentPeriod={currentPeriod}
              onPeriodChange={handlePeriodChange}
            />
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total facturado"
            value={formatPrice(initialData.totalRevenue)}
            description={`Plata que ingresó ${periodDescriptions[currentPeriod]}`}
            icon={<DollarSign className="w-6 h-6 text-green-500" />}
          />
          <StatCard
            title="Turnos atendidos"
            value={initialData.completedBookings}
            description={`Clientes que vinieron ${periodDescriptions[currentPeriod]}`}
            icon={<CheckCircle className="w-6 h-6 text-blue-500" />}
          />
          <StatCard
            title="Turnos perdidos"
            value={initialData.cancelledBookings}
            description={`Te cancelaron ${periodDescriptions[currentPeriod]}`}
            icon={<XCircle className="w-6 h-6 text-red-500" />}
          />
        </div>

        <IncomeOverTimeChart data={initialData.chartData} />
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Tus clientes</CardTitle>
          </CardHeader>
        </Card>

        <ClientMetricsCards metrics={clientMetrics} period={currentPeriod} />

        <ClientInsightsPanel
          metrics={clientMetrics}
          analyticsData={initialData}
          period={currentPeriod}
        />

        <TopClientsTable clients={clientMetrics.topClients} />
      </section>
    </div>
  );
}
