"use client";

import { useFormState, useFormStatus } from "react-dom";
import { type FormState, updateClientNotes } from "@/actions/dashboard.actions";
import { useEffect } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full mt-2" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Guardando...
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          Guardar notas
        </>
      )}
    </Button>
  );
}

interface ClientNotesFormProps {
  clientId: string;
  currentNotes: string | null;
  clientName: string;
}

const initialState: FormState = { error: null, success: null };

export function ClientNotesForm({
  clientId,
  currentNotes,
  clientName,
}: ClientNotesFormProps) {
  const [state, formAction] = useFormState<FormState, FormData>(
    updateClientNotes,
    initialState
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("¡Éxito!", { description: state.success });
    }
    if (state?.error) {
      toast.error("Error", { description: state.error });
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas</CardTitle>
        <CardDescription>
          Añade aquí cualquier detalle importante sobre este cliente. Solo tú
          podrás verlo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid w-full gap-2">
            <Textarea
              id="notes"
              name="notes"
              placeholder="Ej: Prefiere la máquina en el número 2, le gusta hablar de fútbol, alérgico a..."
              defaultValue={currentNotes || ""}
              rows={6}
            />
            <SubmitButton />
          </div>
          <div className="h-5 mt-2 text-sm">
            {state?.error && <p className="text-red-500">{state.error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
