"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ChartDataPoint, Period } from "@/actions/analytics.actions";
import { formatPrice } from "@/lib/utils";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface IncomeOverTimeChartProps {
  data: ChartDataPoint[];
  period: Period;
}

function formatCompactPrice(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

const chartConfig = {
  total: {
    label: "Ingresos",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function IncomeOverTimeChart({ data, period }: IncomeOverTimeChartProps) {
  const shouldShowAllTicks = period === "day" || period === "week";

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-center border-2 border-dashed rounded-lg text-muted-foreground w-full">
        <p>
          No hay suficientes datos de ingresos para mostrar en este período.
        </p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-[300px]">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: 10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={period === "month" || period === "quarter" ? 20 : 30}
          interval={shouldShowAllTicks ? 0 : "preserveStartEnd"}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCompactPrice(value as number)}
          width={60}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value) => formatPrice(value as number)}
            />
          }
        />
        <defs>
          <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-total)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-total)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="total"
          type="monotone"
          fill="url(#fillTotal)"
          fillOpacity={0.4}
          stroke="var(--color-total)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
