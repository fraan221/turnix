import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserForSettings } from "@/lib/data";
import { Role } from "@prisma/client";
import { BillingSkeleton, ClientsSkeleton } from "@/components/skeletons/AnalyticsDashboardSkeleton";
import { BillingDashboard } from "@/components/analytics/BillingDashboard";
import { ClientsDashboard } from "@/components/analytics/ClientsDashboard";
import { RoutePeriodSelector } from "@/components/analytics/PeriodDropdown";
import {
  getAnalyticsData,
  getClientMetrics,
  getFinanceData,
  Period,
} from "@/actions/analytics.actions";

interface AnalyticsPageProps {
  searchParams: Promise<{
    period?: Period;
  }>;
}

async function BillingSection({ period }: { period: Period }) {
  const [analyticsData, financeData] = await Promise.all([
    getAnalyticsData(period),
    getFinanceData(period),
  ]);

  return (
    <BillingDashboard
      analyticsData={analyticsData}
      financeData={financeData}
      period={period}
    />
  );
}

async function ClientsSection({ period }: { period: Period }) {
  const [clientMetricsData, analyticsData] = await Promise.all([
    getClientMetrics(period),
    getAnalyticsData(period),
  ]);

  return (
    <ClientsDashboard
      clientMetrics={clientMetricsData}
      analyticsData={analyticsData}
      period={period}
    />
  );
}

export default async function AnalyticsPage(props: AnalyticsPageProps) {
  const searchParams = await props.searchParams;
  const user = await getUserForSettings();

  if (!user || user.role !== Role.OWNER) {
    redirect("/dashboard");
  }

  const period = searchParams.period || "week";

  return (
    <div className="mx-auto space-y-6 max-w-7xl">
      <div className="flex items-center justify-between border-b pb-4 gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Métricas de rendimiento
        </span>
        <RoutePeriodSelector baseUrl="/dashboard/analytics" />
      </div>

      <div className="space-y-8">
        <Suspense fallback={<BillingSkeleton />}>
          <BillingSection period={period} />
        </Suspense>

        <Suspense fallback={<ClientsSkeleton />}>
          <ClientsSection period={period} />
        </Suspense>
      </div>
    </div>
  );
}
