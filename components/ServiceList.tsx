"use client";

import { Service } from "@prisma/client";
import { Button } from "./ui/button";
import { deleteService } from "@/actions/dashboard.actions";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <Button variant="destructive" size="icon" type="submit" disabled={pending}>
            <Trash2 className="w-4 h-4" />
        </Button>
    )
}

function ServiceItem({ service }: { service: Service }) {
    const [state, formAction] = useFormState(deleteService.bind(null, service.id), null);

    useEffect(() => {
        if (state?.success) {
            toast.success("¡Éxito!", { description: state.success });
        }
        if (state?.error) {
            toast.error("Error", { description: state.error });
        }
    }, [state]);

    return (
        <li className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
            <div>
                <p className="font-semibold">{service.name}</p>
                <p className="text-sm text-gray-600">{formatPrice(service.price)} - {formatDuration(service.durationInMinutes)}</p>
            </div>
            <form action={formAction}>
                <DeleteButton />
            </form>
        </li>
    );
}


export default function ServiceList({ services }: { services: Service[] }) {
  if (services.length === 0) {
    return <p>Aún no has añadido ningún servicio.</p>;
  }

  return (
    <ul className="space-y-2">
      {services.map((service) => (
        <ServiceItem key={service.id} service={service} />
      ))}
    </ul>
  );
}
