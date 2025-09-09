import { Suspense } from "react";
import AnalyticsDashboardSkeleton from "@/components/skeletons/AnalyticsDashboardSkeleton";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { getAnalyticsData, Period } from "@/actions/analytics.actions";

async function AnalyticsDataWrapper({ period }: { period: Period }) {
  const analyticsData = await getAnalyticsData(period);
  return <AnalyticsDashboard initialData={analyticsData} />;
}

interface AnalyticsPageProps {
  searchParams: {
    period?: Period;
  };
}

export default function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const period = searchParams.period || "week";

  return (
    <Suspense fallback={<AnalyticsDashboardSkeleton />}>
      <AnalyticsDataWrapper period={period} />
    </Suspense>
  );
}
