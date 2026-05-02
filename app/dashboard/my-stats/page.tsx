import {
  getPersonalBarberStats,
  getBarberClientMetricsData,
  getBarberFinanceData,
  type Period,
} from "@/actions/analytics.actions";
import BarberStatsDashboard from "@/components/analytics/BarberStatsDashboard";
import AnalyticsDashboardSkeleton from "@/components/skeletons/AnalyticsDashboardSkeleton";
import { Suspense } from "react";

interface MyStatsPageProps {
  searchParams: Promise<{
    period?: Period;
  }>;
}

async function BarberStatsDataWrapper({ period }: { period: Period }) {
  const [stats, clientMetrics, financeData] = await Promise.all([
    getPersonalBarberStats(period),
    getBarberClientMetricsData(period),
    getBarberFinanceData(period),
  ]);

  return (
    <BarberStatsDashboard
      initialData={stats}
      clientMetrics={clientMetrics}
      financeData={financeData}
    />
  );
}

export default async function MyStatsPage(props: MyStatsPageProps) {
  const searchParams = await props.searchParams;
  const period = searchParams.period || "week";

  return (
    <Suspense fallback={<AnalyticsDashboardSkeleton />}>
      <BarberStatsDataWrapper period={period} />
    </Suspense>
  );
}
