import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserForSettings } from "@/lib/data";
import { Role } from "@prisma/client";
import AnalyticsDashboardSkeleton from "@/components/skeletons/AnalyticsDashboardSkeleton";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { getAnalyticsData, getClientMetrics, getFinanceData, Period } from "@/actions/analytics.actions";

async function AnalyticsDataWrapper({ period }: { period: Period }) {
  const [analyticsData, clientMetricsData, financeData] = await Promise.all([
    getAnalyticsData(period),
    getClientMetrics(period),
    getFinanceData(period),
  ]);
  
  return (
    <AnalyticsDashboard 
      initialData={analyticsData} 
      clientMetrics={clientMetricsData}
      financeData={financeData}
    />
  );
}

interface AnalyticsPageProps {
  searchParams: Promise<{
    period?: Period;
  }>;
}

export default async function AnalyticsPage(props: AnalyticsPageProps) {
  const searchParams = await props.searchParams;
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
