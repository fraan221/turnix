"use client";

import { useState } from "react";
import { SubscriptionFeatures } from "@/components/SubscriptionFeatures";
import SubscriptionButton from "@/components/billing/SubscriptionButton";
import {
  DiscountForm,
  DiscountDetails,
} from "@/components/billing/DiscountForm";
import SubscriptionStatus from "./SubscriptionStatus";

type SubscriptionCtaProps = {
  isTrial: boolean;
  showStatus?: boolean;
};

const STANDARD_PRICE = 9900;

export function SubscriptionCta({ isTrial, showStatus }: SubscriptionCtaProps) {
  const [discount, setDiscount] = useState<DiscountDetails | null>(null);

  const currentPrice = discount ? discount.price : STANDARD_PRICE;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-6">
      {showStatus && <SubscriptionStatus />}

      <SubscriptionFeatures price={currentPrice} />

      {!discount && <DiscountForm onCodeApplied={setDiscount} />}

      <SubscriptionButton isTrial={isTrial} discountCode={discount?.code} />
    </div>
  );
}
