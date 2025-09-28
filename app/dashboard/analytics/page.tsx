import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserForSettings } from "@/lib/data";
import { Role } from "@prisma/client";
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
