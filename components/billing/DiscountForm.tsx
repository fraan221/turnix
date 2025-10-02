"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Tag, CheckCircle2 } from "lucide-react";
import { validateDiscountCode } from "@/actions/subscription.actions";

export type DiscountDetails = {
  code: string;
  price: number;
  duration: number;
};

type DiscountFormProps = {
  onCodeApplied: (details: DiscountDetails) => void;
};

export function DiscountForm({ onCodeApplied }: DiscountFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError("Ingresá un código válido");
      return;
    }
    setIsLoading(true);
    setError(null);

    const result = await validateDiscountCode(code);

    if (result.success && result.price && result.duration) {
      setIsApplied(true);
      onCodeApplied({
        code: code.toUpperCase(),
        price: result.price,
        duration: result.duration,
      });
    } else {
      setError(result.error || "Código inválido o vencido");
    }

    setIsLoading(false);
  };

  if (isApplied) {
    return (
      <div className="flex items-center justify-center gap-2 p-3 border border-green-200 rounded-lg bg-green-50">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <p className="text-sm font-medium text-green-700">
          Código aplicado:{" "}
          <span className="font-bold">{code.toUpperCase()}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          ¿Tenés un código de descuento?
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Ingresá tu código"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          disabled={isLoading}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleApplyCode();
            }
          }}
        />
        <Button
          onClick={handleApplyCode}
          disabled={isLoading || !code.trim()}
          size="default"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2 border rounded-md bg-destructive/5 border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
