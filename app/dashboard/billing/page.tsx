import { Suspense } from "react";
import BillingSkeleton from "@/components/skeletons/BillingSkeleton";
import { getUserForLayout } from "@/lib/data";
import { redirect } from "next/navigation";
import ActiveSubscriptionCard from "@/components/billing/ActiveSubscriptionCard";
import SubscriptionStatus from "@/components/billing/SubscriptionStatus";
import SubscriptionButton from "@/components/billing/SubscriptionButton";
import { SubscriptionFeatures } from "@/components/SubscriptionFeatures";

async function BillingPageContent() {
  const user = await getUserForLayout();

  if (!user) {
    redirect("/login");
  }

  const hasActiveSubscription = user.subscription?.status === "authorized";
  const isInTrial =
    !hasActiveSubscription && user.trialEndsAt && user.trialEndsAt > new Date();
  const isCancelled = user.subscription?.status === "cancelled";
  const shouldShowSubscribeCta = isInTrial || isCancelled || !user.subscription;

  return (
    <div>
      {hasActiveSubscription && user.subscription && (
        <ActiveSubscriptionCard subscription={user.subscription} />
      )}

      {shouldShowSubscribeCta && !hasActiveSubscription && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <SubscriptionStatus />
          <SubscriptionFeatures />
          <SubscriptionButton isTrial={!!isInTrial} />
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <BillingPageContent />
    </Suspense>
  );
}
