"use client";

import { useEffect } from "react";
import { AnalyticsErrorState } from "@/components/analytics/AnalyticsErrorState";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Error capturado por el boundary de MyStats:", error);
  }, [error]);

  return <AnalyticsErrorState variant="full" onRetry={reset} />;
}
