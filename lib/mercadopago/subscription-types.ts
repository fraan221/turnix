export const SUBSCRIPTION_STATUSES = {
  AUTHORIZED: "authorized",
  PAUSED: "paused",
  PENDING: "pending",
  CANCELLED: "cancelled",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES];

export type ActiveSubscriptionStatus = "authorized" | "paused";

export function isActiveStatus(
  status: string | null | undefined,
): status is ActiveSubscriptionStatus {
  return status === "authorized" || status === "paused";
}

export function isAuthorizedStatus(
  status: string | null | undefined,
): status is "authorized" {
  return status === "authorized";
}
