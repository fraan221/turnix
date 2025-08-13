import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ActiveSubscriptionCard from "@/components/billing/ActiveSubscriptionCard";
import TrialOrInactiveCard from "@/components/billing/TrialOrInactiveCard";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const hasActiveSubscription = user.subscription?.status === "authorized";
  const isInTrial =
    !hasActiveSubscription && user.trialEndsAt && user.trialEndsAt > new Date();
  const isCancelled = user.subscription?.status === "cancelled";

  return (
    <div className="max-w-3xl mx-auto">
      {hasActiveSubscription && user.subscription && (
        <ActiveSubscriptionCard subscription={user.subscription} />
      )}

      {(isInTrial || isCancelled || !user.subscription) &&
        !hasActiveSubscription && <TrialOrInactiveCard user={user} />}
    </div>
  );
}
