"use client";

import { useEffect, useState, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { linkBarberToShop } from "@/actions/team.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Loader, Plus } from "lucide-react";
import { LinkBarberSchema } from "@/lib/schemas";

const initialState = {
  success: null,
  error: null,
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending ? (
        <>
          <Loader className="mr-2 w-4 h-4 animate-spin" />
          Verificando…
        </>
      ) : (
        "Añadir Barbero al Equipo"
      )}
    </Button>
  );
}

export function AddBarberForm() {
  const [open, setOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [state, formAction] = useActionState(linkBarberToShop, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Éxito!", {
        description: state.success,
      });
      setOpen(false);
      setOtpValue("");
      setValidationError(null);
    }
    if (state?.error) {
      toast.error("Error al vincular", {
        description: state.error,
      });
    }
  }, [state]);

  const isValid = LinkBarberSchema.safeParse({ connectionCode: otpValue }).success;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const result = LinkBarberSchema.safeParse({ connectionCode: otpValue });
    if (!result.success) {
      e.preventDefault();
      setValidationError(result.error.flatten().fieldErrors.connectionCode?.[0] || "Código inválido");
    } else {
      setValidationError(null);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setOtpValue("");
      setValidationError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" />
          Añadir barbero
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir un nuevo barbero</DialogTitle>
          <DialogDescription>
            Pedile a tu barbero su código de conexión de 6 dígitos numéricos e
            ingresalo a continuación para añadirlo a tu equipo.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="flex flex-col gap-4 items-center">
            <Label htmlFor="connectionCode" className="sr-only">
              Código de Conexión
            </Label>
            <InputOTP
              id="connectionCode"
              name="connectionCode"
              maxLength={6}
              value={otpValue}
              onChange={(val) => {
                setOtpValue(val);
                setValidationError(null);
              }}
              autoComplete="off"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {validationError && (
              <p className="text-sm font-medium text-destructive">{validationError}</p>
            )}
          </div>
          <DialogFooter>
            <SubmitButton disabled={!isValid} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

