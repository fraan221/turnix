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

// --- Billing Periods ---
export const BILLING_PERIODS = {
  MONTHLY: "monthly",
  ANNUAL: "annual",
} as const;

export type BillingPeriod =
  (typeof BILLING_PERIODS)[keyof typeof BILLING_PERIODS];

// --- Precios ---
export const PLAN_PRICES = {
  MONTHLY: 9900,
  ANNUAL: 95040, // Estándar: $7.920/mes × 12
  ANNUAL_PROMO: 89100, // Lanzamiento: $7.425/mes × 12
  ANNUAL_MONTHLY_EQUIVALENT: 7920, // Display estándar
  ANNUAL_PROMO_MONTHLY_EQUIVALENT: 7425, // Display promo
} as const;

// --- Promo de lanzamiento ---
// Definir al deployar. La promo dura 1 mes calendario.
export const ANNUAL_PLAN_LAUNCH_DATE = new Date("2026-05-10T00:00:00-03:00"); // Ajustado al día de hoy para que la promo esté activa
export const ANNUAL_PLAN_PROMO_END = new Date(ANNUAL_PLAN_LAUNCH_DATE);
ANNUAL_PLAN_PROMO_END.setMonth(ANNUAL_PLAN_PROMO_END.getMonth() + 1);

export function isAnnualPromoActive(): boolean {
  const now = new Date();
  return now >= ANNUAL_PLAN_LAUNCH_DATE && now < ANNUAL_PLAN_PROMO_END;
}

/** Precio anual actual según si la promo está activa */
export function getCurrentAnnualPrice(): number {
  return isAnnualPromoActive() ? PLAN_PRICES.ANNUAL_PROMO : PLAN_PRICES.ANNUAL;
}

/** Precio mensual equivalente para display */
export function getAnnualMonthlyDisplay(): number {
  return isAnnualPromoActive()
    ? PLAN_PRICES.ANNUAL_PROMO_MONTHLY_EQUIVALENT
    : PLAN_PRICES.ANNUAL_MONTHLY_EQUIVALENT;
}

/** Porcentaje de descuento actual */
export function getAnnualDiscountPercent(): number {
  return isAnnualPromoActive() ? 25 : 20;
}
