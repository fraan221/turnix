"use client";

import { useState } from "react";
import { SubscriptionFeatures } from "@/components/SubscriptionFeatures";
import SubscriptionButton from "@/components/billing/SubscriptionButton";
import {
  DiscountForm,
  DiscountDetails,
} from "@/components/billing/DiscountForm";
import SubscriptionStatus from "./SubscriptionStatus";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BILLING_PERIODS,
  PLAN_PRICES,
  BillingPeriod,
  isAnnualPromoActive,
  getAnnualMonthlyDisplay,
  getAnnualDiscountPercent,
  getCurrentAnnualPrice,
} from "@/lib/mercadopago/subscription-types";
import { Badge } from "@/components/ui/badge";

type SubscriptionCtaProps = {
  isTrial: boolean;
  showStatus?: boolean;
};

export function SubscriptionCta({ isTrial, showStatus }: SubscriptionCtaProps) {
  const [discount, setDiscount] = useState<DiscountDetails | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(
    BILLING_PERIODS.ANNUAL,
  );

  const isAnnual = billingPeriod === BILLING_PERIODS.ANNUAL;

  const displayMonthlyPrice = isAnnual
    ? getAnnualMonthlyDisplay()
    : discount
      ? discount.price
      : PLAN_PRICES.MONTHLY;
  const originalMonthlyPrice = PLAN_PRICES.MONTHLY;

  return (
    <div className="flex flex-col justify-center items-center mx-auto space-y-6 w-full max-w-md">
      {showStatus && <SubscriptionStatus />}

      <Tabs
        defaultValue={BILLING_PERIODS.ANNUAL}
        className="w-full"
        onValueChange={(v) => setBillingPeriod(v as BillingPeriod)}
      >
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value={BILLING_PERIODS.ANNUAL}>
            Anual
          </TabsTrigger>
          <TabsTrigger value={BILLING_PERIODS.MONTHLY}>Mensual</TabsTrigger>
        </TabsList>
      </Tabs>

      <SubscriptionFeatures
        price={displayMonthlyPrice}
        originalPrice={isAnnual || discount ? originalMonthlyPrice : undefined}
        billingPeriod={billingPeriod}
        totalAnnual={isAnnual ? getCurrentAnnualPrice() : undefined}
      />

      {!isAnnual && !discount && <DiscountForm onCodeApplied={setDiscount} />}


      <SubscriptionButton
        isTrial={isTrial}
        discountCode={!isAnnual ? discount?.code : undefined}
        billingPeriod={billingPeriod}
      />
    </div>
  );
}
