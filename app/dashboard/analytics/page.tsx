import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserForSettings } from "@/lib/data";
import { Role } from "@prisma/client";
import AnalyticsDashboardSkeleton from "@/components/skeletons/AnalyticsDashboardSkeleton";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { getAnalyticsData, getClientMetrics, Period } from "@/actions/analytics.actions";

async function AnalyticsDataWrapper({ period }: { period: Period }) {
  const [analyticsData, clientMetricsData] = await Promise.all([
    getAnalyticsData(period),
    getClientMetrics(period),
  ]);
  
  return (
    <AnalyticsDashboard 
      initialData={analyticsData} 
      clientMetrics={clientMetricsData} 
    />
  );
}

interface AnalyticsPageProps {
  searchParams: {
    period?: Period;
  };
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const user = await getUserForSettings();

  if (!user || user.role !== Role.OWNER) {
    redirect("/dashboard");
  }

  const period = searchParams.period || "week";

  return (
    <Suspense fallback={<AnalyticsDashboardSkeleton />}>
      <AnalyticsDataWrapper period={period} />
    </Suspense>
  );
}
