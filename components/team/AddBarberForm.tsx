"use client";

import { useEffect, useState, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
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
import { Loader2, Plus } from "lucide-react";

const initialState = {
  success: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Verificando...
        </>
      ) : (
        "Añadir Barbero al Equipo"
      )}
    </Button>
  );
}

export function AddBarberForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(linkBarberToShop, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Éxito!", {
        description: state.success,
      });
      setOpen(false);
    }
    if (state?.error) {
      toast.error("Error al vincular", {
        description: state.error,
      });
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" />
          Añadir Barbero
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir un nuevo barbero</DialogTitle>
          <DialogDescription>
            Pídele a tu barbero su código de conexión de 6 caracteres e
            ingrésalo a continuación para añadirlo a tu equipo.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          action={(formData) => {
            formAction(formData);
            formRef.current?.reset();
          }}
          className="space-y-6"
        >
          <div className="flex flex-col items-center gap-4">
            <Label htmlFor="connectionCode" className="sr-only">
              Código de Conexión
            </Label>
            <InputOTP id="connectionCode" name="connectionCode" maxLength={6}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
