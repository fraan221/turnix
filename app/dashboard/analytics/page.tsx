import {
  getAnalyticsData,
  Period,
  AnalyticsData,
} from "@/actions/analytics.actions";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

interface AnalyticsPageProps {
  searchParams: {
    period?: Period;
  };
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const period = searchParams.period || "week";
  const analyticsData: AnalyticsData = await getAnalyticsData(period);

  return <AnalyticsDashboard initialData={analyticsData} />;
}
