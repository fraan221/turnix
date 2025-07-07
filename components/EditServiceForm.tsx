"use client";

import { Service } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { updateService } from "@/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";

function SubmitButton() {
     const { pending } = useFormStatus();
     return (
          <Button type="submit" disabled={pending}>
               {pending ? "Guardando..." : "Guardar Cambios"}
          </Button>
     );
}

export default function EditServiceForm({ service }: { service: Service }) {
     const router = useRouter();
     const updateServiceWithId = updateService.bind(null, service.id);
     const [state, formAction] = useFormState(updateServiceWithId, null);

     useEffect(() => {
     if (state?.success) {
          toast.success("Servicio actualizado!", { description: state.success });
          router.push('/dashboard/services');
     }
     if (state?.error) {
          toast.error("Error", { description: state.error });
     }
     }, [state, router]);

     return (
          <form action={formAction} className="grid gap-4">
               <div className="grid gap-2">
                    <Label htmlFor="name">Nombre del Servicio</Label>
                    <Input id="name" name="name" defaultValue={service.name} required />
               </div>
               <div className="grid gap-2">
                    <Label htmlFor="price">Precio ($)</Label>
                    <Input id="price" name="price" type="number" step="0.01" defaultValue={service.price} required />
               </div>
               <div className="grid gap-2">
                    <Label htmlFor="duration">Duración (minutos) (Opcional)</Label>
                    <Input id="duration" name="duration" type="number" defaultValue={service.durationInMinutes || ""} />
               </div>
               <div className="grid gap-2">
                    <Label htmlFor="description">Descripción (Opcional)</Label>
                    <Textarea id="description" name="description" defaultValue={service.description || ""} />
               </div>
               <div className="flex justify-end gap-2">
                    <Link href="/dashboard/services">
                         <Button type="button" variant="secondary">Cancelar</Button>
                    </Link>
                    <SubmitButton />
               </div>
          </form>
     );
}
