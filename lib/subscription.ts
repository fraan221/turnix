import type { Session } from "next-auth";
import { isActiveStatus } from "@/lib/mercadopago/subscription-types";

const GRACE_PERIOD_DAYS = 2;

export function hasActiveSubscription(session: Session | null): boolean {
  const user = session?.user;
  if (!user) return false;

  if (user.trialEndsAt && new Date(user.trialEndsAt).getTime() > Date.now()) {
    return true;
  }

  if (!user.subscription?.status || !user.subscription.currentPeriodEnd) {
    return false;
  }

  if (!isActiveStatus(user.subscription.status)) {
    return false;
  }

  const gracePeriodEnd = new Date(user.subscription.currentPeriodEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  return gracePeriodEnd.getTime() > Date.now();
}
