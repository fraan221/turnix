import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserForLayout } from "@/lib/data";
import BillingSkeleton from "@/components/skeletons/BillingSkeleton";
import { SubscriptionCta } from "@/components/billing/SubscriptionCta";
import SubscriptionStatus from "@/components/billing/SubscriptionStatus";

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
    <div className="space-y-8">
      <SubscriptionStatus subscription={user.subscription} />
      {!hasActiveSubscription && shouldShowSubscribeCta && (
        <SubscriptionCta isTrial={!!isInTrial} showStatus={false} />
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
