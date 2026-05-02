import { PaymentMethodBreakdown } from "@/actions/analytics.actions";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Banknote, Smartphone, CreditCard, HelpCircle } from "lucide-react";

interface PaymentBreakdownCardsProps {
  breakdown: PaymentMethodBreakdown[];
}

export function PaymentBreakdownCards({ breakdown }: PaymentBreakdownCardsProps) {
  const methodConfig: Record<string, { label: string; icon: React.ReactNode; colorClass: string }> = {
    CASH: { label: "Efectivo", icon: <Banknote className="w-6 h-6" />, colorClass: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-800" },
    TRANSFER: { label: "Transferencia / MP", icon: <Smartphone className="w-6 h-6" />, colorClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
    CARD: { label: "Tarjeta", icon: <CreditCard className="w-6 h-6" />, colorClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
    UNCLASSIFIED: { label: "Sin clasificar", icon: <HelpCircle className="w-6 h-6" />, colorClass: "bg-muted/50 text-muted-foreground border-muted" },
  };

  const totalRevenue = breakdown.reduce((sum, item) => sum + item.total, 0);

  const displayItems = ["CASH", "TRANSFER", "CARD", "UNCLASSIFIED"]
    .map(method => breakdown.find(item => item.method === method) || { method, count: 0, total: 0 })
    .filter(item => item.method !== "UNCLASSIFIED" || item.count > 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayItems.map((item) => {
        const config = methodConfig[item.method];
        const percentage = totalRevenue > 0 ? Math.round((item.total / totalRevenue) * 100) : 0;
        
        return (
          <Card key={item.method} className={cn("border overflow-hidden", config.colorClass)}>
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-2">
                <span aria-hidden="true">{config.icon}</span>
                <span className="text-xs font-semibold px-2 py-1 bg-background/50 rounded-full">
                  {percentage}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium mb-1 opacity-80">{config.label}</p>
                <p className="text-2xl font-bold">{formatPrice(item.total)}</p>
                <p className="text-xs opacity-70 mt-1">
                  {item.count} {item.count === 1 ? "turno" : "turnos"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
