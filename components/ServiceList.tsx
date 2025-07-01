"use client";

import { Service } from "@prisma/client";
import { Button } from "./ui/button";
import { deleteService } from "@/actions/dashboard.actions";
import { formatPrice, formatDuration } from "@/lib/utils";

interface ServiceListProps {
  services: Service[];
}

export default function ServiceList({ services }: ServiceListProps) {
  if (services.length === 0) {
    return <p>Aún no has añadido ningún servicio.</p>;
  }

  return (
    <ul className="space-y-2">
      {services.map((service) => (
        <li key={service.id} className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
          <div>
            <p className="font-semibold">{service.name}</p>
            <p className="text-sm text-gray-600">{formatPrice(service.price)} - {formatDuration(service.durationInMinutes)}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => deleteService(service.id)}>
            Borrar
          </Button>
        </li>
      ))}
    </ul>
  );
}