import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserForLayout } from "@/lib/data";
import ActiveSubscriptionCard from "@/components/billing/ActiveSubscriptionCard";
import BillingSkeleton from "@/components/skeletons/BillingSkeleton";
import { SubscriptionCta } from "@/components/billing/SubscriptionCta";

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
        <SubscriptionCta isTrial={!!isInTrial} showStatus={true} />
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
