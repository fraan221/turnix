"use client";

import type { Period, PersonalStatsData } from "@/actions/analytics.actions";
import { IncomeOverTimeChart } from "@/components/analytics/IncomeOverTimeChart";
import { StatCard } from "@/components/analytics/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import { DollarSign, Scissors, Users, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface BarberStatsDashboardProps {
  initialData: PersonalStatsData;
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
              : "hover:bg-background/50",
          )}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};

export default function BarberStatsDashboard({
  initialData,
}: BarberStatsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get("period") as Period) || "week";

  const handlePeriodChange = (newPeriod: Period) => {
    router.push(`/dashboard/my-stats?period=${newPeriod}`);
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
          <CardTitle>Mis estadísticas</CardTitle>
          <PeriodSelector
            currentPeriod={currentPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </CardHeader>
      </Card>

      <div className="grid max-w-5xl grid-cols-1 gap-4 mx-auto md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ingresos generados"
          value={formatPrice(initialData.totalRevenue)}
          description={`Plata que ingresó ${periodDescriptions[currentPeriod]}`}
          icon={<DollarSign className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          title="Turnos atendidos"
          value={initialData.completedBookings}
          description={`Clientes que vinieron ${periodDescriptions[currentPeriod]}`}
          icon={<Scissors className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="Turnos perdidos"
          value={initialData.cancelledBookings}
          description={`Te cancelaron ${periodDescriptions[currentPeriod]}`}
          icon={<XCircle className="w-6 h-6 text-red-500" />}
        />
        <StatCard
          title="Clientes únicos"
          value={initialData.uniqueClients}
          description={`Clientes atendidos ${periodDescriptions[currentPeriod]}`}
          icon={<Users className="w-6 h-6 text-violet-500" />}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        <IncomeOverTimeChart data={initialData.chartData} />
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">Servicios más Populares</CardTitle>
        </CardHeader>
        <CardContent>
          {initialData.topServices.length > 0 ? (
            <ul className="space-y-4">
              {initialData.topServices.map((service, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between pb-2 border-b last:border-b-0"
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="text-lg font-bold text-muted-foreground">
                    {service.count}{" "}
                    <span className="text-sm font-normal">
                      {service.count === 1 ? "vez" : "veces"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground">
              Aún no tienes suficientes datos para mostrar tus servicios más
              populares.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
