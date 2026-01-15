import { create } from "zustand";

const GRACE_PERIOD_DAYS = 2;

interface SubscriptionData {
  status: string | null;
  currentPeriodEnd: Date | null;
}

interface HydrateData {
  subscription: SubscriptionData | null;
  trialEndsAt: Date | null;
}

interface SubscriptionState {
  // State
  status: string | null;
  currentPeriodEnd: Date | null;
  isInTrial: boolean;
  trialEndsAt: Date | null;
  isHydrated: boolean;

  // Computed functions
  hasAccess: () => boolean;
  isPro: () => boolean;
  isTrialActive: () => boolean;

  // Actions
  hydrate: (data: HydrateData) => void;
  setStatus: (status: string | null) => void;
  setSubscription: (data: SubscriptionData) => void;
  clearSubscription: () => void;
}

/**
 * Zustand store for reactive subscription status.
 * Acts as the client-side source of truth for subscription state.
 *
 * Features:
 * - Hydration from session on app load
 * - Reactive updates when subscription changes
 * - Computed functions for access checks
 * - Grace period support for expired subscriptions
 */
export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial state
  status: null,
  currentPeriodEnd: null,
  isInTrial: false,
  trialEndsAt: null,
  isHydrated: false,

  // Check if user has access (trial OR valid subscription)
  hasAccess: () => {
    const state = get();

    // Check trial first
    if (state.isTrialActive()) {
      return true;
    }

    // Check subscription
    if (!state.status || !state.currentPeriodEnd) {
      return false;
    }

    // Only authorized status grants access
    if (state.status !== "authorized" && state.status !== "paused") {
      return false;
    }

    // Check if within period + grace period
    const gracePeriodEnd = new Date(state.currentPeriodEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    return gracePeriodEnd.getTime() > Date.now();
  },

  // Check if user is PRO (authorized subscription)
  isPro: () => {
    const state = get();
    return state.status === "authorized";
  },

  // Check if trial is still active
  isTrialActive: () => {
    const state = get();
    if (!state.trialEndsAt) return false;
    return new Date(state.trialEndsAt).getTime() > Date.now();
  },

  // Hydrate store from session data (called on app load)
  hydrate: (data: HydrateData) => {
    const trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null;
    const isInTrial = trialEndsAt ? trialEndsAt.getTime() > Date.now() : false;

    set({
      status: data.subscription?.status || null,
      currentPeriodEnd: data.subscription?.currentPeriodEnd
        ? new Date(data.subscription.currentPeriodEnd)
        : null,
      trialEndsAt,
      isInTrial,
      isHydrated: true,
    });
  },

  // Update just the status (used after payment verification)
  setStatus: (status: string | null) => {
    set({ status });
    // If status becomes authorized, clear trial state
    if (status === "authorized") {
      set({ isInTrial: false, trialEndsAt: null });
    }
  },

  // Update full subscription data
  setSubscription: (data: SubscriptionData) => {
    set({
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd
        ? new Date(data.currentPeriodEnd)
        : null,
    });
    // If authorized, clear trial
    if (data.status === "authorized") {
      set({ isInTrial: false, trialEndsAt: null });
    }
  },

  // Clear subscription (e.g., on logout)
  clearSubscription: () => {
    set({
      status: null,
      currentPeriodEnd: null,
      isInTrial: false,
      trialEndsAt: null,
      isHydrated: false,
    });
  },
}));
