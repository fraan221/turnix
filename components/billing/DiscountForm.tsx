"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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

  const handleApplyCode = async () => {
    if (!code) {
      setError("Por favor, ingresa un código.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const result = await validateDiscountCode(code);

    if (result.success && result.price && result.duration) {
      onCodeApplied({
        code: code.toUpperCase(),
        price: result.price,
        duration: result.duration,
      });
    } else {
      setError(result.error || "El código de descuento no es válido.");
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-sm space-y-2">
      <p className="text-sm text-center text-muted-foreground">
        ¿Tenés un código de descuento?
      </p>
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Ej: EVENTO-OCTUBRE"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isLoading}
          className="text-center"
        />
        <Button onClick={handleApplyCode} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      {error && (
        <p className="pt-1 text-sm text-center text-destructive">{error}</p>
      )}
    </div>
  );
}
