"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/analytics/StatCard";
import { IncomeOverTimeChart } from "@/components/analytics/IncomeOverTimeChart";
import { formatPrice } from "@/lib/utils";
import { DollarSign, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import type { AnalyticsData, Period } from "@/actions/analytics.actions";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface AnalyticsDashboardProps {
  initialData: AnalyticsData;
}

const PeriodSelector: React.FC<{
  currentPeriod: Period;
  onPeriodChange: (period: Period) => void;
}> = ({ currentPeriod, onPeriodChange }) => {
  const periods: { value: Period; label: string }[] = [
    { value: "day", label: "Hoy" },
    { value: "week", label: "Esta Semana" },
    { value: "month", label: "Este Mes" },
  ];

  return (
    <div className="flex items-center p-1 space-x-1 border rounded-lg bg-muted">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={currentPeriod === period.value ? "default" : "ghost"}
          onClick={() => onPeriodChange(period.value)}
          className={cn(
            "w-full transition-all duration-150",
            currentPeriod === period.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-background/50"
          )}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard({
  initialData,
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get("period") as Period) || "week";

  const handlePeriodChange = (newPeriod: Period) => {
    router.push(`/dashboard/analytics?period=${newPeriod}`);
  };

  if (initialData.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{initialData.error}</p>
      </div>
    );
  }

  const periodDescriptions: Record<Period, string> = {
    day: "en las últimas 24 horas",
    week: "en los últimos 7 días",
    month: "en los últimos 30 días",
  };

  return (
    <div className="mx-auto space-y-2 max-w-7xl">
      <Card>
        <CardHeader className="flex items-center justify-between gap-2 sm:flex-row xs:flex-col">
          <CardTitle>Tu facturación</CardTitle>
          <PeriodSelector
            currentPeriod={currentPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </CardHeader>
      </Card>

      <div className="grid max-w-4xl grid-cols-1 gap-4 mx-auto md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total facturado"
          value={formatPrice(initialData.totalRevenue)}
          description={`Plata que ingresó ${periodDescriptions[currentPeriod]}`}
          icon={<DollarSign className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          title="Turnos atendidos"
          value={initialData.completedBookings}
          description={`Clientes que vinieron ${periodDescriptions[currentPeriod]}`}
          icon={<CheckCircle className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="Turnos perdidos"
          value={initialData.cancelledBookings}
          description={`Te cancelaron ${periodDescriptions[currentPeriod]}`}
          icon={<XCircle className="w-6 h-6 text-red-500" />}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        <IncomeOverTimeChart data={initialData.chartData} />
      </div>
    </div>
  );
}
