"use client";
// NOTA: TODO - AGREGAR LA ELIMINACION DE UN SERVICIO PERO PARA MAS ADELANTE
import { Service } from "@prisma/client";
import { Button } from "./ui/button";
// import { deleteService } from "@/actions/service.actions";
// import { useTransition } from "react";
// import { toast } from "sonner";
import { Pencil } from "lucide-react";
// import { Trash2 } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";
import Link from "next/link";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";

function ServiceItem({ service }: { service: Service }) {
  // const [isPending, startTransition] = useTransition();

  // const handleDelete = () => {
  //   startTransition(async () => {
  //     const result = await deleteService(service.id);
  //     if (result?.success) {
  //       toast.success("¡Éxito!", { description: result.success });
  //     }
  //     if (result?.error) {
  //       toast.error("Error", { description: result.error });
  //     }
  //   });
  // };

  return (
    <li className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <p className="font-semibold">{service.name}</p>

        {service.description && (
          <p className="mt-1 text-xs text-gray-500">{service.description}</p>
        )}

        <div className="flex items-center mt-1 text-sm text-gray-600 gap-x-2">
          <span>{formatPrice(service.price)}</span>
          {service.durationInMinutes && service.durationInMinutes > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <span>{formatDuration(service.durationInMinutes)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-x-2">
        <Link href={`/dashboard/services/${service.id}/edit`}>
          <Button variant="outline" size="icon">
            <Pencil className="w-4 h-4" />
          </Button>
        </Link>

        {/* 
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                el servicio
                <span className="font-semibold"> "{service.name}"</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        */}
      </div>
    </li>
  );
}

export default function ServiceList({ services }: { services: Service[] }) {
  if (services.length === 0) {
    return <p>Aún no has añadido ningún servicio.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {services.map((service) => (
        <ServiceItem key={service.id} service={service} />
      ))}
    </ul>
  );
}
