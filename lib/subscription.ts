import type { Session } from "next-auth";
import { isActiveStatus } from "@/lib/mercadopago/subscription-types";

const GRACE_PERIOD_DAYS = 2;
const PENDING_GRACE_PERIOD_DAYS = 3;

export function hasActiveSubscription(session: Session | null): boolean {
  const user = session?.user;
  if (!user) return false;

  if (user.trialEndsAt && new Date(user.trialEndsAt).getTime() > Date.now()) {
    return true;
  }

  if (!user.subscription?.status || !user.subscription.currentPeriodEnd) {
    return false;
  }

  if (
    user.subscription.status === "pending" &&
    user.subscription.pendingSince
  ) {
    const pendingSince = new Date(user.subscription.pendingSince);
    const pendingGraceEnd = new Date(pendingSince);
    pendingGraceEnd.setDate(
      pendingGraceEnd.getDate() + PENDING_GRACE_PERIOD_DAYS,
    );
    return pendingGraceEnd.getTime() > Date.now();
  }

  if (!isActiveStatus(user.subscription.status)) {
    return false;
  }

  const gracePeriodEnd = new Date(user.subscription.currentPeriodEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  return gracePeriodEnd.getTime() > Date.now();
}

export function isPaymentFailure(session: Session | null): boolean {
  const user = session?.user;
  if (!user) return false;

  if (
    user.subscription?.status === "pending" &&
    user.subscription.pendingSince
  ) {
    const pendingSince = new Date(user.subscription.pendingSince);
    const pendingGraceEnd = new Date(pendingSince);
    pendingGraceEnd.setDate(
      pendingGraceEnd.getDate() + PENDING_GRACE_PERIOD_DAYS,
    );
    return pendingGraceEnd.getTime() <= Date.now();
  }

  return false;
}
