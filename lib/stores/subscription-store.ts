import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { isActiveStatus } from "@/lib/mercadopago/subscription-types";

const GRACE_PERIOD_DAYS = 2;
const PENDING_GRACE_PERIOD_DAYS = 3;

interface SubscriptionData {
  status: string | null;
  currentPeriodEnd: Date | null;
  pendingSince?: Date | null;
}

interface HydrateData {
  subscription: SubscriptionData | null;
  trialEndsAt: Date | null;
}

interface SubscriptionState {
  status: string | null;
  currentPeriodEnd: Date | null;
  pendingSince: Date | null;
  trialEndsAt: Date | null;
  isHydrated: boolean;

  hydrate: (data: HydrateData) => void;
  setStatus: (status: string | null) => void;
  setSubscription: (data: SubscriptionData) => void;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools(
    (set) => ({
      status: null,
      currentPeriodEnd: null,
      pendingSince: null,
      trialEndsAt: null,
      isHydrated: false,

      hydrate: (data: HydrateData) => {
        set(
          {
            status: data.subscription?.status || null,
            currentPeriodEnd: data.subscription?.currentPeriodEnd
              ? new Date(data.subscription.currentPeriodEnd)
              : null,
            pendingSince: data.subscription?.pendingSince
              ? new Date(data.subscription.pendingSince)
              : null,
            trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
            isHydrated: true,
          },
          false,
          "hydrate",
        );
      },

      setStatus: (status: string | null) => {
        set(
          (state) => ({
            status,
            trialEndsAt: status === "authorized" ? null : state.trialEndsAt,
          }),
          false,
          "setStatus",
        );
      },

      setSubscription: (data: SubscriptionData) => {
        set(
          (state) => ({
            status: data.status,
            currentPeriodEnd: data.currentPeriodEnd
              ? new Date(data.currentPeriodEnd)
              : null,
            pendingSince: data.pendingSince
              ? new Date(data.pendingSince)
              : null,
            trialEndsAt:
              data.status === "authorized" ? null : state.trialEndsAt,
          }),
          false,
          "setSubscription",
        );
      },

      clearSubscription: () => {
        set(
          {
            status: null,
            currentPeriodEnd: null,
            pendingSince: null,
            trialEndsAt: null,
            isHydrated: false,
          },
          false,
          "clearSubscription",
        );
      },
    }),
    { name: "SubscriptionStore" },
  ),
);

export const selectStatus = (state: SubscriptionState) => state.status;

export const selectTrialEndsAt = (state: SubscriptionState) =>
  state.trialEndsAt;

export const selectCurrentPeriodEnd = (state: SubscriptionState) =>
  state.currentPeriodEnd;

export const selectPendingSince = (state: SubscriptionState) =>
  state.pendingSince;

export const selectIsHydrated = (state: SubscriptionState) => state.isHydrated;

export const selectIsPro = (state: SubscriptionState) =>
  state.status === "authorized";

export const selectIsTrialActive = (state: SubscriptionState) => {
  if (!state.trialEndsAt) return false;
  return new Date(state.trialEndsAt).getTime() > Date.now();
};

export const selectHasAccess = (state: SubscriptionState) => {
  if (state.trialEndsAt && new Date(state.trialEndsAt).getTime() > Date.now()) {
    return true;
  }
  if (!state.status || !state.currentPeriodEnd) {
    return false;
  }

  if (state.status === "pending" && state.pendingSince) {
    const pendingGraceEnd = new Date(state.pendingSince);
    pendingGraceEnd.setDate(
      pendingGraceEnd.getDate() + PENDING_GRACE_PERIOD_DAYS,
    );
    return pendingGraceEnd.getTime() > Date.now();
  }

  if (!isActiveStatus(state.status)) {
    return false;
  }

  const gracePeriodEnd = new Date(state.currentPeriodEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  return gracePeriodEnd.getTime() > Date.now();
};
