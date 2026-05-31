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
    <div className="mx-auto space-y-8 max-w-7xl">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Estadísticas</h1>
          <p className="text-sm text-muted-foreground">
            Monitoreá el rendimiento de tu barbería
          </p>
        </div>
        <RoutePeriodSelector baseUrl="/dashboard/analytics" />
      </div>

      <div className="space-y-10">
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
