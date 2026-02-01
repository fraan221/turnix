"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  useSubscriptionStore,
  selectStatus,
  selectIsHydrated,
} from "@/lib/stores/subscription-store";

export function SubscriptionHydrator() {
  const { data: session, status, update } = useSession();
  const hydrate = useSubscriptionStore((state) => state.hydrate);
  const storeStatus = useSubscriptionStore(selectStatus);
  const isHydrated = useSubscriptionStore(selectIsHydrated);
  const hasRefreshedRef = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user && !isHydrated) {
      hydrate({
        subscription: session.user.subscription
          ? {
              status: session.user.subscription.status,
              currentPeriodEnd: session.user.subscription.currentPeriodEnd
                ? new Date(session.user.subscription.currentPeriodEnd)
                : null,
              pendingSince: session.user.subscription.pendingSince
                ? new Date(session.user.subscription.pendingSince)
                : null,
            }
          : null,
        trialEndsAt: session.user.trialEndsAt
          ? new Date(session.user.trialEndsAt)
          : null,
      });
    }
  }, [session, status, hydrate, isHydrated]);

  useEffect(() => {
    if (
      isHydrated &&
      storeStatus === "authorized" &&
      session?.user?.subscription?.status !== "authorized" &&
      !hasRefreshedRef.current
    ) {
      hasRefreshedRef.current = true;
      update();
    }
  }, [storeStatus, session?.user?.subscription?.status, isHydrated, update]);

  useEffect(() => {
    if (status === "authenticated" && session?.user && isHydrated) {
      const sessionStatus = session.user.subscription?.status || null;
      if (sessionStatus && sessionStatus !== storeStatus) {
        hydrate({
          subscription: session.user.subscription
            ? {
                status: session.user.subscription.status,
                currentPeriodEnd: session.user.subscription.currentPeriodEnd
                  ? new Date(session.user.subscription.currentPeriodEnd)
                  : null,
                pendingSince: session.user.subscription.pendingSince
                  ? new Date(session.user.subscription.pendingSince)
                  : null,
              }
            : null,
          trialEndsAt: session.user.trialEndsAt
            ? new Date(session.user.trialEndsAt)
            : null,
        });
      }
    }
  }, [
    session?.user?.subscription?.status,
    session?.user?.trialEndsAt,
    isHydrated,
    storeStatus,
    hydrate,
    status,
    session,
  ]);

  return null;
}
