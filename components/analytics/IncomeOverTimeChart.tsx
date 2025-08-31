"use client"; // Solución: Añadir esta directiva

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ChartDataPoint } from "@/actions/analytics.actions";
import { formatPrice } from "@/lib/utils";

interface IncomeOverTimeChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm border rounded-lg shadow-sm bg-background">
        <p className="font-bold label">{`${label}`}</p>
        <p className="text-blue-500 intro">{`Ingresos: ${formatPrice(
          payload[0].value
        )}`}</p>
      </div>
    );
  }
  return null;
};

export function IncomeOverTimeChart({ data }: IncomeOverTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-center border-2 border-dashed rounded-lg text-muted-foreground">
        <p>
          No hay suficientes datos de ingresos para mostrar en este período.
        </p>
      </div>
    );
  }
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -10,
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
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${formatPrice(value as number)}`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "hsl(var(--accent))" }}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
