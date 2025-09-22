"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Role, Service } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceList from "@/components/ServiceList";
import { Plus } from "lucide-react";
import { GroupedService } from "./page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const AddServiceModalContent = dynamic(
  () =>
    import("@/components/AddServiceModal").then(
      (mod) => mod.AddServiceModalContent
    ),
  { ssr: false }
);

const ModalContentSkeleton = () => (
  <>
    <DialogHeader>
      <DialogTitle>
        <Skeleton className="w-48 h-6" />
      </DialogTitle>
      <DialogDescription>
        <Skeleton className="w-full h-4" />
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="w-full h-20" />
      </div>
    </div>
    <DialogFooter>
      <Skeleton className="w-24 h-10" />
      <Skeleton className="w-32 h-10" />
    </DialogFooter>
  </>
);

interface ServicesClientProps {
  userId: string;
  userRole: Role;
  initialServices: Service[];
  initialGroupedServices: GroupedService[];
  teamsEnabled: boolean;
}

export function ServicesClient({
  userId,
  userRole,
  initialServices,
  initialGroupedServices,
  teamsEnabled,
}: ServicesClientProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Lista de Servicios</CardTitle>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Crear servicio
          </Button>
        </CardHeader>
        <CardContent>
          {userRole === Role.OWNER && teamsEnabled ? (
            <div className="space-y-8">
              {initialGroupedServices.map(
                ({ barberId, barberName, services }) => (
                  <div key={barberId}>
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold">
                        {barberName}
                        {barberId === userId && " (Tú)"}
                      </h3>
                      <Separator className="flex-1" />
                    </div>
                    <ServiceList services={services} />
                  </div>
                )
              )}
            </div>
          ) : (
            <ServiceList services={initialServices} />
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {isModalOpen && (
            <Suspense fallback={<ModalContentSkeleton />}>
              <AddServiceModalContent onClose={() => setModalOpen(false)} />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
