import { StatCard } from "@/components/analytics/StatCard";
import { IncomeOverTimeChart } from "@/components/analytics/IncomeOverTimeChart";
import { PaymentBreakdownCards } from "@/components/analytics/PaymentBreakdownCards";
import { TeamRevenueTable } from "@/components/analytics/TeamRevenueTable";
import { AnalyticsErrorState } from "@/components/analytics/AnalyticsErrorState";
import { formatPrice } from "@/lib/utils";
import { DollarSign, CheckCircle, XCircle } from "lucide-react";
import React from "react";
import type { AnalyticsData, FinanceData, Period } from "@/actions/analytics.actions";

interface BillingDashboardProps {
  analyticsData: AnalyticsData;
  financeData: FinanceData;
  period: Period;
}

const periodDescriptions: Record<Period, string> = {
  day: "en las últimas 24 horas",
  week: "en los últimos 7 días",
  month: "en los últimos 30 días",
  lastMonth: "el mes pasado",
  year: "este año",
  all: "en total",
};

export function BillingDashboard({
  analyticsData,
  financeData,
  period,
}: BillingDashboardProps) {
  // If there's an error in analytics data, show section error state
  if (analyticsData.error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Tu facturación</h2>
        <AnalyticsErrorState 
          title="No pudimos cargar los datos de facturación" 
          variant="inline" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Tu facturación
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total facturado"
            value={formatPrice(analyticsData.totalRevenue)}
            description={`Plata que ingresó ${periodDescriptions[period]}`}
            icon={<DollarSign className="w-6 h-6 text-green-500" />}
          />
          <StatCard
            title="Turnos atendidos"
            value={analyticsData.completedBookings}
            description={`Clientes que vinieron ${periodDescriptions[period]}`}
            icon={<CheckCircle className="w-6 h-6 text-blue-500" />}
          />
          <StatCard
            title="Turnos perdidos"
            value={analyticsData.cancelledBookings}
            description={`Te cancelaron ${periodDescriptions[period]}`}
            icon={<XCircle className="w-6 h-6 text-red-500" />}
          />
        </div>

        <IncomeOverTimeChart
          data={analyticsData.chartData}
          period={period}
        />
      </section>

      {financeData.error ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Métodos de cobro y equipo</h2>
          <AnalyticsErrorState 
            title="No pudimos cargar los datos financieros y del equipo" 
            variant="inline" 
          />
        </section>
      ) : (
        <>
          {financeData.breakdown?.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Métodos de cobro
              </h2>
              <PaymentBreakdownCards breakdown={financeData.breakdown} />
            </section>
          )}

          {financeData.teamBreakdown && financeData.teamBreakdown.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Rendimiento del equipo
              </h2>
              <TeamRevenueTable data={financeData.teamBreakdown} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
