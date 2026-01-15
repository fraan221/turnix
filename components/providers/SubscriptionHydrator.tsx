"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";

/**
 * Hydrates the Zustand subscription store with session data.
 * Place this component in the dashboard layout to ensure the store
 * is synchronized with the session on initial load.
 * 
 * Also handles forcing session refresh when subscription status changes.
 */
export function SubscriptionHydrator() {
  const { data: session, status, update } = useSession();
  const hydrate = useSubscriptionStore((state) => state.hydrate);
  const storeStatus = useSubscriptionStore((state) => state.status);
  const isHydrated = useSubscriptionStore((state) => state.isHydrated);
  const hasRefreshedRef = useRef(false);

  // Initial hydration from session
  useEffect(() => {
    if (status === "authenticated" && session?.user && !isHydrated) {
      hydrate({
        subscription: session.user.subscription
          ? {
              status: session.user.subscription.status,
              currentPeriodEnd: session.user.subscription.currentPeriodEnd
                ? new Date(session.user.subscription.currentPeriodEnd)
                : null,
            }
          : null,
        trialEndsAt: session.user.trialEndsAt
          ? new Date(session.user.trialEndsAt)
          : null,
      });
    }
  }, [session, status, hydrate, isHydrated]);

  // When store status changes (e.g., after payment verification), 
  // force a session update to sync JWT with DB
  useEffect(() => {
    if (
      isHydrated && 
      storeStatus === "authorized" && 
      session?.user?.subscription?.status !== "authorized" &&
      !hasRefreshedRef.current
    ) {
      hasRefreshedRef.current = true;
      // Force session refresh to get latest data from DB
      update();
    }
  }, [storeStatus, session?.user?.subscription?.status, isHydrated, update]);

  // Sync store when session updates
  useEffect(() => {
    if (status === "authenticated" && session?.user && isHydrated) {
      const sessionStatus = session.user.subscription?.status || null;
      // Only update if session has newer data
      if (sessionStatus && sessionStatus !== storeStatus) {
        hydrate({
          subscription: session.user.subscription
            ? {
                status: session.user.subscription.status,
                currentPeriodEnd: session.user.subscription.currentPeriodEnd
                  ? new Date(session.user.subscription.currentPeriodEnd)
                  : null,
              }
            : null,
          trialEndsAt: session.user.trialEndsAt
            ? new Date(session.user.trialEndsAt)
            : null,
        });
      }
    }
  }, [session?.user?.subscription?.status, session?.user?.trialEndsAt, isHydrated, storeStatus, hydrate, status, session]);

  return null;
}
