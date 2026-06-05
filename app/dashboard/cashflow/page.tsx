import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserForSettings } from "@/lib/data";
import { Role } from "@prisma/client";
import CashflowDashboardSkeleton from "@/components/cashflow/CashflowDashboardSkeleton";
import CashflowDashboard from "@/components/cashflow/CashflowDashboard";
import { getCashflowData } from "@/actions/cashflow.actions";

async function CashflowDataWrapper({
  period,
  customDate,
}: {
  period: string;
  customDate?: string;
}) {
  const data = await getCashflowData(period, customDate);

  if ("error" in data) {
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg text-destructive text-center max-w-md mx-auto">
        <h3 className="font-semibold text-lg">Error al cargar datos</h3>
        <p className="text-sm mt-1">{data.error}</p>
      </div>
    );
  }

  return <CashflowDashboard initialData={data} period={period} customDate={customDate} />;
}

interface PageProps {
  searchParams: Promise<{
    period?: string;
    date?: string;
  }>;
}

export default async function CashflowPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const user = await getUserForSettings();

  if (!user || user.role !== Role.OWNER) {
    redirect("/dashboard");
  }

  // Check PRO plan (Trial Active or Subscription Authorized)
  const isTrialActive = user.trialEndsAt && new Date(user.trialEndsAt).getTime() > Date.now();
  const isSubActive = user.subscription?.status === "authorized";

  if (!isTrialActive && !isSubActive) {
    redirect("/dashboard/billing");
  }

  const period = searchParams.period || "month";
  const customDate = searchParams.date;

  return (
    <Suspense fallback={<CashflowDashboardSkeleton />}>
      <CashflowDataWrapper period={period} customDate={customDate} />
    </Suspense>
  );
}
