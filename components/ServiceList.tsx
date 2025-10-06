"use client";

import { Service } from "@prisma/client";
import Link from "next/link";
import { Button } from "./ui/button";
import { Pencil, Scissors, Clock, DollarSign } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";

interface ServiceItemProps {
  service: Service;
}

function ServiceItem({ service }: ServiceItemProps) {
  return (
    <li className="relative flex flex-col p-4 transition-all border-2 group rounded-xl hover:border-primary/50 bg-card">
      <div className="flex-1 space-y-2">
        <h3 className="pr-12 text-base font-semibold sm:text-lg text-foreground">
          {service.name}
        </h3>

        {service.description && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <DollarSign className="w-4 h-4 text-primary" />
            <span>{formatPrice(service.price)}</span>
          </div>

          {service.durationInMinutes && service.durationInMinutes > 0 && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(service.durationInMinutes)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <Link
        href={`/dashboard/services/${service.id}/edit`}
        className="absolute top-4 right-4"
      >
        <Button
          variant="outline"
          size="icon"
          className="transition-all h-9 w-9 hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          <Pencil className="w-4 h-4" />
          <span className="sr-only">Editar servicio {service.name}</span>
        </Button>
      </Link>
    </li>
  );
}

interface ServiceListProps {
  services: Service[];
}

export default function ServiceList({ services }: ServiceListProps) {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 border-2 border-dashed rounded-xl bg-muted/30">
        <div className="p-4 mb-4 rounded-full bg-primary/10">
          <Scissors className="w-8 h-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-center">
          Todavía no tenés servicios
        </h3>
        <p className="max-w-sm text-sm text-center text-muted-foreground">
          Creá tu primer servicio para que tus clientes puedan reservar turnos
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {services.map((service) => (
        <ServiceItem key={service.id} service={service} />
      ))}
    </ul>
  );
}
