"use client";

import { TimeBlock } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { updateTimeBlock } from "@/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

function SubmitButton() {
     const { pending } = useFormStatus();
     return (
          <Button type="submit" disabled={pending}>
               {pending ? "Guardando..." : "Guardar Cambios"}
          </Button>
     );
}

const formatDateForInput = (date: Date) => format(new Date(date), 'dd/MM/yyyy');
const formatTimeForInput = (date: Date) => format(new Date(date), 'HH:mm');

export default function EditTimeBlockForm({ timeBlock }: { timeBlock: TimeBlock }) {
     const router = useRouter();
     const updateTimeBlockWithId = updateTimeBlock.bind(null, timeBlock.id);
     const [state, formAction] = useFormState(updateTimeBlockWithId, null);

     useEffect(() => {
     if (state?.success) {
          toast.success("¡Éxito!", { description: state.success });
          router.push('/dashboard/schedule');
     }
     if (state?.error) {
          toast.error("Error", { description: state.error });
     }
     }, [state, router]);

     return (
          <form action={formAction} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                         <Label htmlFor="startDate">Fecha de Inicio</Label>
                         <Input id="startDate" name="startDate" type="date" defaultValue={formatDateForInput(timeBlock.startTime)} required />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="endDate">Fecha de Fin</Label>
                         <Input id="endDate" name="endDate" type="date" defaultValue={formatDateForInput(timeBlock.endTime)} required />
                    </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                         <Label htmlFor="startTime">Hora de Inicio</Label>
                         <Input id="startTime" name="startTime" type="time" defaultValue={formatTimeForInput(timeBlock.startTime)} required />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="endTime">Hora de Fin</Label>
                         <Input id="endTime" name="endTime" type="time" defaultValue={formatTimeForInput(timeBlock.endTime)} required />
                    </div>
               </div>
               <div className="space-y-2">
                    <Label htmlFor="reason">Razón (Opcional)</Label>
                    <Input id="reason" name="reason" placeholder="Ej: Vacaciones, Feriado" defaultValue={timeBlock.reason || ""} />
               </div>
               <div className="flex justify-end gap-2">
                    <Link href="/dashboard/schedule">
                         <Button type="button" variant="secondary">Cancelar</Button>
                    </Link>
                    <SubmitButton />
               </div>
          </form>
     );
}
