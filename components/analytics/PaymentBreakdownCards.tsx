import {
  PaymentMethodBreakdown,
  TransferSubAccountBreakdown,
} from "@/actions/analytics.actions";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Banknote, Smartphone, CreditCard, HelpCircle } from "lucide-react";

interface PaymentBreakdownCardsProps {
  breakdown: PaymentMethodBreakdown[];
}

export function PaymentBreakdownCards({
  breakdown,
}: PaymentBreakdownCardsProps) {
  const methodConfig: Record<
    string,
    {
      label: string;
      icon: React.ReactNode;
      colorClass: string;
    }
  > = {
    CASH: {
      label: "Efectivo",
      icon: <Banknote className="size-5 text-green-600 dark:text-green-400" />,
      colorClass:
        "border-green-200/80 bg-green-50/40 dark:bg-green-950/20 dark:border-green-900/60",
    },
    TRANSFER: {
      label: "Transferencia / MP",
      icon: <Smartphone className="size-5 text-blue-600 dark:text-blue-400" />,
      colorClass:
        "border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900/60",
    },
    CARD: {
      label: "Tarjeta",
      icon: <CreditCard className="size-5 text-purple-600 dark:text-purple-400" />,
      colorClass:
        "border-purple-200/80 bg-purple-50/40 dark:bg-purple-950/20 dark:border-purple-900/60",
    },
    UNCLASSIFIED: {
      label: "Sin clasificar",
      icon: <HelpCircle className="size-5 text-muted-foreground" />,
      colorClass: "border-border/60 bg-muted/30",
    },
  };

  const displayItems = ["CASH", "TRANSFER", "CARD", "UNCLASSIFIED"]
    .map(
      (method) =>
        breakdown.find((item) => item.method === method) || {
          method,
          count: 0,
          total: 0,
        },
    )
    .filter((item) => item.method !== "UNCLASSIFIED" || item.total > 0 || item.count > 0);

  const transferItem = breakdown.find((item) => item.method === "TRANSFER");
  const transferAccounts: TransferSubAccountBreakdown[] =
    transferItem?.transferAccounts ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Tarjetas principales de métodos de cobro */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayItems.map((item) => {
          const config = methodConfig[item.method] || methodConfig.UNCLASSIFIED;

          return (
            <Card
              key={item.method}
              className={cn("border shadow-xs", config.colorClass)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-foreground">
                  {config.label}
                </CardTitle>
                {config.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {formatPrice(item.total)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desglose por cuenta de transferencia / MP */}
      {transferAccounts.length > 0 && (
        <Card className="border shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-border/50">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Por cuenta de transferencia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {transferAccounts.map((acc, idx) => (
                <div
                  key={`${acc.alias}-${acc.holder}-${idx}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate leading-tight">
                      {acc.holder || acc.alias || "Sin cuenta asignada"}
                    </p>
                    {acc.holder && acc.alias && (
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                        {acc.alias}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-base text-foreground shrink-0">
                    {formatPrice(acc.total)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
