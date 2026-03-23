import { getPersonalBarberStats, type Period } from "@/actions/analytics.actions";
import BarberStatsDashboard from "@/components/analytics/BarberStatsDashboard";
import AnalyticsDashboardSkeleton from "@/components/skeletons/AnalyticsDashboardSkeleton";
import { Suspense } from "react";

interface MyStatsPageProps {
  searchParams: {
    period?: Period;
  };
}

async function BarberStatsDataWrapper({ period }: { period: Period }) {
  const stats = await getPersonalBarberStats(period);

  return <BarberStatsDashboard initialData={stats} />;
}

export default async function MyStatsPage({ searchParams }: MyStatsPageProps) {
  const period = searchParams.period || "week";

  return (
    <Suspense fallback={<AnalyticsDashboardSkeleton />}>
      <BarberStatsDataWrapper period={period} />
    </Suspense>
  );
}
