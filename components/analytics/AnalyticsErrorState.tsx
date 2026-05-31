"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudOff, RefreshCw } from "lucide-react";
import { useTransition } from "react";

interface AnalyticsErrorStateProps {
  title?: string;
  description?: string;
  variant?: "inline" | "full";
  onRetry?: () => void;
}

export function AnalyticsErrorState({
  title,
  description,
  variant = "inline",
  onRetry,
}: AnalyticsErrorStateProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRetry = () => {
    startTransition(async () => {
      if (onRetry) {
        onRetry();
      } else {
        router.refresh();
      }
    });
  };

  const defaultTitle = variant === "full" 
    ? "No pudimos cargar tus estadísticas" 
    : "No pudimos cargar esta sección";
    
  const defaultDescription = "Esto puede deberse a un problema de conexión temporal o alta demanda en el sistema. Podés intentar recargar.";

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;

  if (variant === "inline") {
    return (
      <Card className="border-dashed border-muted-foreground/20 bg-muted/5">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="p-3 bg-muted/50 rounded-full text-muted-foreground">
            <CloudOff className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-sm text-foreground">{finalTitle}</h3>
            <p className="text-xs text-muted-foreground max-w-md">{finalDescription}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isPending}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Recargando..." : "Reintentar"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full page variant
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <Card className="max-w-md w-full border-muted-foreground/15 shadow-sm">
        <CardHeader className="space-y-4 pb-4">
          <div className="mx-auto p-4 bg-muted/50 rounded-full text-muted-foreground w-fit">
            <CloudOff className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold tracking-tight">{finalTitle}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {finalDescription}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex justify-center pt-2 pb-6">
          <Button
            onClick={handleRetry}
            disabled={isPending}
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Cargando..." : "Reintentar"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
