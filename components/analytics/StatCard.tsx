import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  change?: number;
}

export function StatCard({ title, value, description, icon, change }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center text-xs font-medium",
                change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
              )}
            >
              {change > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : change < 0 ? (
                <TrendingDown className="w-3 h-3 mr-1" />
              ) : null}
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </div>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
