"use client";

import { useState, useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createService } from "@/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Loader2Icon } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="mb-3">
      {pending ? (
        <>
          <Loader2Icon className="w-4 h-4 animate-spin" />
          Creando...
        </>
      ) : (
        "Crear servicio"
      )}
    </Button>
  );
}

export default function AddServiceModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createService, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Éxito!", { description: state.success });
      setOpen(false);
    }
    if (state?.error) {
      let errorMessage = "Ocurrió un error inesperado.";
      if (typeof state.error === "string") {
        errorMessage = state.error;
      } else {
        const errorValues = Object.values(state.error).flat();
        if (errorValues.length > 0) {
          errorMessage = errorValues[0] as string;
        }
      }
      toast.error("Error de validación", { description: errorMessage });
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" />
          Crear servicio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Servicio</DialogTitle>
          <DialogDescription>
            Completa los datos para añadir un nuevo servicio a tu lista.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Servicio</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej: Corte Fade"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Precio ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              placeholder="Ej: 10.50"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duración (minutos) (Opcional)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              placeholder="Ej: 30"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe brevemente el servicio..."
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
