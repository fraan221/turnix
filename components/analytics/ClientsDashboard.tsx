import { ClientMetricsCards } from "@/components/analytics/ClientMetricsCards";
import { ClientInsightsPanel } from "@/components/analytics/ClientInsightsPanel";
import { TopClientsTable } from "@/components/analytics/TopClientsTable";
import { TopServicesCard } from "@/components/analytics/TopServicesCard";
import { AnalyticsErrorState } from "@/components/analytics/AnalyticsErrorState";
import React from "react";
import type { AnalyticsData, ClientMetricsData, Period } from "@/actions/analytics.actions";

interface ClientsDashboardProps {
  clientMetrics: ClientMetricsData;
  analyticsData: AnalyticsData;
  period: Period;
  customDate?: string;
}

export function ClientsDashboard({
  clientMetrics,
  analyticsData,
  period,
  customDate,
}: ClientsDashboardProps) {
  if (clientMetrics.error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Tus clientes</h2>
        <AnalyticsErrorState 
          title="No pudimos cargar los datos de tus clientes" 
          variant="inline" 
        />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Tus clientes</h2>
      </div>

      <ClientMetricsCards metrics={clientMetrics} period={period} customDate={customDate} />

      {!analyticsData.error && (
        <ClientInsightsPanel
          metrics={clientMetrics}
          analyticsData={analyticsData}
          period={period}
          customDate={customDate}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopClientsTable clients={clientMetrics.topClients} />
        {analyticsData.error ? (
          <div className="flex flex-col justify-center h-full">
            <AnalyticsErrorState 
              title="No pudimos cargar los servicios más solicitados" 
              variant="inline" 
            />
          </div>
        ) : (
          <TopServicesCard services={analyticsData.topServices} />
        )}
      </div>
    </section>
  );
}
