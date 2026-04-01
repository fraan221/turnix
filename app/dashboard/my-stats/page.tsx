import { getPersonalBarberStats, getBarberClientMetricsData, type Period } from "@/actions/analytics.actions";
import BarberStatsDashboard from "@/components/analytics/BarberStatsDashboard";
import AnalyticsDashboardSkeleton from "@/components/skeletons/AnalyticsDashboardSkeleton";
import { Suspense } from "react";

interface MyStatsPageProps {
  searchParams: {
    period?: Period;
  };
}

async function BarberStatsDataWrapper({ period }: { period: Period }) {
  const [stats, clientMetrics] = await Promise.all([
    getPersonalBarberStats(period),
    getBarberClientMetricsData(period),
  ]);

  return <BarberStatsDashboard initialData={stats} clientMetrics={clientMetrics} />;
}

export default async function MyStatsPage({ searchParams }: MyStatsPageProps) {
  const period = searchParams.period || "week";

  return (
    <Suspense fallback={<AnalyticsDashboardSkeleton />}>
      <BarberStatsDataWrapper period={period} />
    </Suspense>
  );
}
