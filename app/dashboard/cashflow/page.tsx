import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserForSettings } from "@/lib/data";
import { Role } from "@prisma/client";
import CashflowDashboardSkeleton from "@/components/cashflow/CashflowDashboardSkeleton";
import CashflowDashboard from "@/components/cashflow/CashflowDashboard";
import { getCashflowData } from "@/actions/cashflow.actions";

async function CashflowDataWrapper({ period }: { period: string }) {
  const data = await getCashflowData(period);

  if ("error" in data) {
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg text-destructive text-center max-w-md mx-auto">
        <h3 className="font-semibold text-lg">Error al cargar datos</h3>
        <p className="text-sm mt-1">{data.error}</p>
      </div>
    );
  }

  return <CashflowDashboard initialData={data} period={period} />;
}

interface PageProps {
  searchParams: Promise<{
    period?: string;
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

  return (
    <Suspense fallback={<CashflowDashboardSkeleton />}>
      <CashflowDataWrapper period={period} />
    </Suspense>
  );
}
